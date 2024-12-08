#!/usr/bin/env node

import {
  writeFileSync,
} from 'fs';

import {
  run_command_quietly,
  run_command_sync,
  run_command_sync_to_console,
  folder_exists,
} from 'rad-scripts';

import {
  git_changes,
  git_sync,
  npm_update_version,
  parse_tag_parameters,
} from '@moodboom/git-semver';


// -------------------------------------------------
// HELPERS
// -------------------------------------------------

// --------------------------------------
// callApi
// --------------------------------------
// This is a generic function to call an API.
// It adds the accept and content-type headers for you,
// and allows you to specify success and error responses.
// It's async, so you can fire and async-handle the response,
// or await to get a sync response.
export const callApi = ({
  headers = {},
  url,
  method = 'POST',
  contents,
  successResponse,
  errorResponse = console.error,
}) => {

  headers[ 'Content-Type' ] = 'application/json; charset=UTF-8';
  headers.Accept = 'application/json';

  // DEBUG
  // console.log( "headers", JSON.stringify( headers ));

  fetch(
    url,
    {
      method,
      headers,
      body: contents ? JSON.stringify( contents ) : undefined,
    },
  )
    .then( response => response.json())
    .then( data => {
      if ( successResponse ) {
        successResponse( data );
      }
    })
    .catch( err => errorResponse( err ));
};


// --------------------------------------
// getPublicIp
// --------------------------------------
// Get existing external IP address via ipify
// PROMISE-based for chainability
// --------------------------------------
const ipifyUrl = 'https://api.ipify.org?format=json';
export const getPublicIp = async () => {

  // SIMPLEST
  return new Promise( resolve => {
    const response = fetch( ipifyUrl )
      .then( response => response.json())
      .then( data => {
      // console.log( 'data:', JSON.stringify( data ));
        resolve( data.ip );
      })
      .catch( err => console.error( err ));
  });

  // THERE BE DRAGONS HERE, never got to properly unwind the promises here...
  // READ UP:
  // https://stackoverflow.com/questions/44735669/how-to-make-javascript-fetch-synchronous
  //
  // OR USE callApi
  // return new Promise(resolve => {
  //   const gotExternalIp = result => { resolve( result.ip ); };
  //   callApi({
  //     method: 'GET',
  //     url: ipifyUrl,
  //     success: gotExternalIp,
  //   });
  // });

}

// -------------------------------------------------


const usage_text = `# cloudflare-sync-dns

This command can be called regularly (e.g. via cron) to keep your DNS records up to date when your ISP assigns you a new IP address.

Specifically, the script will:

1) maintain a local copy of the IP that was last set in your cloudflare DNS records
2) check your external IP address, comparing it to the cloudflare DNS record
3) if the external IP has changed:
* load cloudflare settings and keys from a local JSON file
* call the cloudflare API to get all DNS record ids
* call the cloudflare API for each DNS record and update it to the new external IP
* optionally run firewall and LAN scripts, and ensure all hosts are resolving 
* only after everything is verified, update the local copy of the IP

## Installation
* Install a recent version of node.js
* Install this module globally
* a) You can clone the repository then do an [npm install -g]
* b) Or you can just do a global install [npm install -g cloudflare-sync-dns]
* Copy cloudflareSettings-template.json (in project folder) outside of the module to where you store configurations, and adjust accordingly
* Specify the settings file when you run, eg: cloudflare-sync-dns /path/to/my/settings.json
* Add a cron job to run the script regularly.  Every minute should work well, as most of the time it just does a local check.

[Documentation](https://bitpost.com/wiki/Cloudflare-sync-dns) | [News](https://bitpost.com/news)

Note there is also a command console for a few admin commands.

Usage: csd [command]

  cmd+options           short description
  ---------------------------------------
  sync                  [sy]  (admin-only) sync this module, ie: pull, commit, tag, push, publish to npm
`;


export const csd = ( target, args ) => {
  if ( target == 'update' || target == 'up' ) {

    const run_cmd = `git pull && npm install && npm link`;
    run_command_sync_to_console( run_cmd );

  } else if ( target == 'sync' || target == 'sy' ) {

    if ( !folder_exists( '../cloudflare-sync-dns' )) {
      console.log( `You should sync from the repo root folder.` );
      process.exit( 1 );
    }

    const tagParams = parse_tag_parameters( args, 1 ); // noslice = 1

    // git_sync to commit and tag a new version as appropriate.
    const stampCallbackFunction = ( err, version ) => {
      if ( err ) throw err;
      const adjustedVersion = npm_update_version( version );

      // Quietly reinstall, so we get any recently-made changes to usage.
      run_command_quietly( 'npm install -g' );

      // Directly update README.md with usage, whoop
      let readme = run_command_sync( 'csd' );

      // Let's add the version, and the most recent commits, to the readme, for fun.
      // Note that usage will not include this, only the README.md file.
      // But it should be visible on github/npm.
      readme += "\n\nMost recent commits...\n";
      readme += run_command_sync( 'git-log 4' )
      readme += "\nVersion " + version;
      readme += "\n";

      const filename = 'README.md';
      writeFileSync( filename, readme, 'utf-8' );
      return adjustedVersion;
    };

    // SYNC and PUBLISH CHANGES
    const changes = git_changes( process.cwd());
    git_sync( process.cwd(), tagParams, stampCallbackFunction );
    if ( changes ) {
      // There were changes, so let's publish now.
      run_command_sync_to_console( 'npm publish --access public' );
    }

    // Quietly reinstall, so we get any recently-made remote changes.
    run_command_quietly( 'npm install -g' );

  } else {
    // Getting the usage is important in scripts, don't error out.
    console.log( usage_text );
  }
}
