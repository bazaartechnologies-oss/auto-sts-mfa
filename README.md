### Generates AWS Session Token

Generates an AWS STS session token and updates in the shared credentials file

Provided that your shared credentials exist in the ".aws" folder within your home directory (you can specify different folder in arguments although). The shared credentials should be of the format as defined in sample folder.

#### Sample command:

`node index -p live -a 1234567890 -r eu-west-1 -u username -t 123435`

or

`npm start -- -p live -a 1234567890 -r eu-west-1 -u username -t 123435`

* -p is for source profile in creds file
* -a is for account number of AWS
* -r is the region to set in config file
* -u is the username that needs to login
* -t is the token code in your MFA application
* -f (optional) is the folder where your credentials & config files exist
* -d is the duration till when the session token will be valid (default is 8 hours)

#### How it works:

1. Generates the STS token using the given arguments
2. Reads the shared credentials file, creates backup and updates/sets the default profile with the new creds
3. Reads the shared config file, updates the region for default profile

#### Pre-requisites:

`npm install`

#### Extensions

Modify the package.json file (see sample command in scripts in package.json) to add short-hands for different accounts config and use like

`npm run live -- -t 123334`

#### Dependencies

Uses AWS official Nodejs SDK, [ini](https://www.npmjs.com/package/ini) npm package and [command-line-args](https://www.npmjs.com/package/command-line-args)

LICENSE: **MIT**