/**
 * Requires AWS SDK & ini reader library
 */
const { homedir } = require('os')
const { join } = require('path')

Promise.resolve([
    { name: 'profile', alias: 'p', type: String, defaultValue: "sandbox" },
    { name: 'region', alias: 'r', type: String },
    { name: 'account', alias: 'a', type: Number },
    { name: 'username', alias: 'u', type: String },
    { name: 'token', alias: 't', type: String },
    { name: 'aws_dir', alias: 'f', type: String, defaultValue: join(homedir(), '.aws') },
    { name: 'duration', alias: 'd', type: Number, defaultValue: 60 * 60 * 8 /* 8 hours */ }
]).then((optionsDefinition) => {
    const cliArgs = require('command-line-args')
    const options = cliArgs(optionsDefinition)
    return validateArgs(options, optionsDefinition)
})
.then(generateSessionToken)
.then(configureDefaultProfile)
.then(() => info("Successfully generated the token and updated the creds file"))
.catch((err) => {
    error(err.message, err.error)
    process.exit(err.code)
})

error = (...args) => console.error(...args)
info  = (...args) => console.info(...args)

function generateSessionToken(options) {
    const AWS = require('aws-sdk')

    info("Generating session token...")
    return new Promise((resolve, reject) => {
        const sts = new AWS.STS({
            credentials: new AWS.SharedIniFileCredentials({profile: options.profile})
        })

        sts.getSessionToken({
            DurationSeconds: options.duration, 
            SerialNumber: `arn:aws:iam::${options.account}:mfa/${options.username}`, 
            TokenCode: options.token
        }, (err, data) => {
            if (err) {
                return reject({message: "Failed to generate session token", code: 2, error: err})
            }

            const creds = data["Credentials"]
            resolve({
                accessKeyId: creds["AccessKeyId"], 
                secretAccessKey: creds["SecretAccessKey"], 
                sessionToken: creds["SessionToken"], 
                region: options.region,
                expiresAt: creds["Expiration"],
                awsDir: options.aws_dir
            })
        })
    })
}

function configureDefaultProfile(options) {
    const { readFileSync, writeFileSync, copyFileSync } = require('fs')
    const ini = require('ini')

    info("Updating credentials...")

    /* configure creds, etc */

    const credsFile = join(options.awsDir, 'credentials')
    const credsFileBackup = join(options.awsDir, 'credentials.bak')

    copyFileSync(credsFile, credsFileBackup)

    const creds = ini.parse(readFileSync(credsFile, 'utf-8'))

    creds.default = { 
        "aws_access_key_id": options.accessKeyId,
        "aws_secret_access_key": options.secretAccessKey,
        "aws_session_token": options.sessionToken,
        "expires_at": options.expiresAt
    }

    writeFileSync(credsFile, ini.stringify(creds))

    /* configure region, etc */

    info("Updating config...")
    
    const configFile = join(options.awsDir, 'config')
    const config = ini.parse(readFileSync(configFile, 'utf-8'))
    config.default.region = options.region

    writeFileSync(configFile, ini.stringify(config))
}

/**
 * 
 * @param {*} options
 * @param {*} optionsDefinition
 */
function validateArgs(options, optionsDefinition) {
    return new Promise((resolve, reject) => {
        const errors = optionsDefinition
            .filter(definition => definition.defaultValue === undefined && options[definition.name]  === undefined)
            .map(definition => `--${definition.name} is required`)

        if (errors.length > 0) {
            return reject({
                message: errors.join('\n'),
                code: 1,
                err: new Error("Parsing failed")
            })
        }

        resolve(options)
    })
}