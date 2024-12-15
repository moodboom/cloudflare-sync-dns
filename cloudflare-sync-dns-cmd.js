#!/usr/bin/env node

import { DateTime } from 'luxon';

import {
  readFileSync,
  writeFileSync,
} from 'fs';

import {
  hostname,
  file_exists,
  run_command_sync_to_console,
  ping_google,
  ping,
} from 'rad-scripts';

import {
  getPublicIp,
  callApi,
} from './csd.js';

// The path to the settings file must be provided as the first parameter.
// Get the settings loaded and validated.
// 0 = node, 1 = script path, so we ignore those.
// 2 = first parameter, the settings file.
const cloudflareSettingsFile = process.argv[ 2 ];
if ( !cloudflareSettingsFile ) {
  console.log( 'Usage: cloudflare-sync-dns /path/to/settings.JSON' );
  console.log( 'Details: https://gitlab.com/moodboom/cloudflare-sync-dns' );
  process.exit( 1 );
}

const baseUrl = 'https://api.cloudflare.com/client/v4/zones';

const timestampShort = timestamp => timestamp.toLocaleString( DateTime.DATETIME_SHORT );
const timestampShortNow = () => timestampShort( DateTime.now());

// WE NEED A MASTER SYNC CHAIN FUNCTION.
// See Javascript scrap for the initial sync chain skeleton, fun!
// We will use a chain of promise functions that do the work and "resolve" when done.
// NOTE I was thinking we could do some fun async parallel scripting.
// But it turned out we need it all to be sync this time.
// NOTE that any errors should be generally reported, and will short-circuit the chain completion.
// If no update is needed, nothing is returned so that cron does not send an email.

const createDnsHistoryAsNeeded = async dnsHistoryFile => {
  return new Promise(( resolve, reject ) => {
    if ( !file_exists( dnsHistoryFile )) {
      const initialHistory = [{ ip: '0.0.0.0', date: timestampShortNow() }];
      writeFileSync( dnsHistoryFile, JSON.stringify( initialHistory ), 'utf-8' );
      resolve( true );
    }
    resolve( false );
  });
}

const loadDnsHistory = async dnsHistoryFile => {
  return new Promise(( resolve, reject ) => {
    try {
      const historyFileString = readFileSync( dnsHistoryFile, 'utf8' );
      const ha = JSON.parse( historyFileString );
      const lastDnsIp = ha[ ha.length - 1 ].ip;
      resolve( lastDnsIp );
    }
    catch( e ) {
      console.log( 'loadDnsHistory error', e );
      reject( e );
    }
  });
}

const loadCloudflareSettings = async () => {
  return new Promise(( resolve, reject ) => {
    try {
      const cloudflareSettingsFileString = readFileSync( cloudflareSettingsFile, 'utf8' );
      const s = JSON.parse( cloudflareSettingsFileString );
      if ( 
          !s
        || !( s.accountAPIKey )
        || !( s.accountEmail )
        || !( s.zoneIds?.length )
        || !( s.routerHostname )
      ) {
        reject( 'Your cloudflareSettings.JSON file does not contain all required settings.' );
      }

      const { routerHostname } = s;
      
      // If not on router, log and exit.
      if ( hostname() !== routerHostname ) {
        reject( `This script is only intended to run on ${routerHostname}, not ${hostname()}.` );
      }

      resolve( s );
    }
    catch( e ) {
      console.log( `\nCould not load ${cloudflareSettingsFile}, make sure you have created and configured it.\n` );
      reject( e );
    }
  });
}

// GET DNS RECORDS
// We GET DNS records first, so we can later use the dns_record_ids to update IP.
const getDnsRecords = async ({ headers, domain, zoneId }) => {
  return new Promise(( resolve, reject ) => {

    // We just want A records, which contain the IP address of the domain.
    // Note that there are many filtering options available, KISS.
    // const aFilter = 'type=A&match=any&order=type&direction=desc&per_page=100&page=1';
    const aFilter = 'type=A&match=any&order=type&direction=desc';
    const zoneGetUrl = `${baseUrl}/${zoneId}/dns_records?${aFilter}`;

    // TOTHINK: Account (all domains) vs zone (one domain!)
    // const accountGetUrl = `${baseUrl}/dns_records?account.id=${accountId}&${aFilter}`;

    // Get existing Cloudflare DNS A records
    const gotDnsRecords = data => {
      const dnsData = data.result.map( d => ({
        name: d.name,
        id: d.id,
        proxied: d.proxiable,
        zoneId,
      }));
      if ( dnsData.find( d => d.name !== domain )) {
        console.log( `Warning: domain ${ domain } returned name ${ d.name }` );
      }
      resolve( dnsData );
    };
    callApi({
      headers,
      method: 'GET',
      url: zoneGetUrl,
      successResponse: gotDnsRecords,
    });
  });
}

const updateDns = async ({ headers, currentExternalIp, dnsRecord }) => {
  return new Promise(( resolve, reject ) => {

    const baseUrl = 'https://api.cloudflare.com/client/v4/zones';

    const patchedDnsRecord = data => {
      resolve( true );
    };
    const body = JSON.stringify({
      "comment": "Domain verification record",
      'type': 'A',
      'name': dnsRecord.name,
      'content': currentExternalIp,
      'ttl': 1, // cloudflare says use 1 for "automatic"
      "proxied": dnsRecord.proxied,
    });

    const dnsPatchUrl = `${baseUrl}/dns_records/${dnsRecord.zoneId}/dns_records/${dnsRecord.id}`;
    callApi({
      headers,
      method: 'PATCH',
      url: dnsPatchUrl,
      body,
      successResponse: patchedDnsRecord,
    });
  });
}

const resetLan = async ( restartFirewallScript, pingChecks ) => {
  return new Promise(( resolve, reject ) => {

    // 1 reset firewall with new IP
    run_command_sync_to_console( restartFirewallScript );

    // 2 verify we can ping both externally and internally
    const bLanOk = ping_google() && pingChecks.every( p => ping( p ));

    resolve( bLanOk );
  });
}

const addCurrentIpToDnsHistory = async currentExternalIp => {
  return new Promise(( resolve, reject ) => {
    try {
      const historyFileString = readFileSync( historyFile, 'utf8' );
      const h = JSON.parse( historyFileString );
      h.push({
        ip: currentExternalIp,
        date: timestampShortNow(),
      });
      writeFileSync( historyFile, JSON.stringify( h, null, 2 ), 'utf-8' );
      resolve( true );
    }
    catch( e ) {
      console.log( 'loadDnsHistory error', e );
      resolve( false );
    }
  });
}

const syncDnsChainParent = async () => {
  try {
    const chainLog = [];
    chainLog.push( `${timestampShortNow()} Chain running...` );

    const settings = await loadCloudflareSettings();
    const {
      accountAPIKey,
      accountEmail,
      zoneIds,
      restartFirewallScript,
      pingChecks,
      dnsHistoryFile,
    } = settings;
    chainLog.push( `${timestampShortNow()} Settings loaded` );

    const currentExternalIp = await getPublicIp();
    chainLog.push( `${timestampShortNow()} External IP: ${ currentExternalIp }` );

    const bCreated = await createDnsHistoryAsNeeded( dnsHistoryFile );
    chainLog.push( `${timestampShortNow()} Create history as needed: ${bCreated}` );

    const lastDnsIp = await loadDnsHistory( dnsHistoryFile );
    chainLog.push( `${timestampShortNow()} Load last: ${lastDnsIp}` );

    if ( currentExternalIp !== lastDnsIp ) {

      const headers = {
        'X-Auth-Key': accountAPIKey,
        'X-Auth-Email': accountEmail,
  
        // 2024/11/13 I COULD NOT GET THIS GOING for v4 at this time.
        // Even tho cloudflare recommends it, none of their docs are updated to use it.
        // Also, it does not work and the "old" key+email way does.  lol
        // 'Authorization': `Bearer ${cloudflareAPIToken}`,
      };  

      // NOTE LOOPS with await cannot use forEach.
      // Simply use a normal for.
      let dnsRecords = [];
      for ( const z of zoneIds ) {
        const dnsParams = { headers, ...z };
        const dnsZoneRecords = await getDnsRecords( dnsParams );
        dnsRecords = dnsRecords.concat( dnsZoneRecords );
      };
      chainLog.push( `${timestampShortNow()} Got ${dnsRecords.length} DNS records` );

      let bUpdateOk = true;
      for ( const dnsRecord of dnsRecords ) {

        const bOk = await updateDns({ headers, currentExternalIp, dnsRecord });
        chainLog.push( `${timestampShortNow()} Updated ${ dnsRecord.name } to IP ${currentExternalIp}` );

        bUpdateOk = bUpdateOk && bOk;
      };
      chainLog.push( `${timestampShortNow()} Update all DNS records: ${bUpdateOk}` );

      const bLanOk = await resetLan( restartFirewallScript, pingChecks );
      chainLog.push( `${timestampShortNow()} Reset LAN: ${bLanOk}` );

      if ( bLanOk ) {

        // Update the local DNS history with the new IP.
        const bUpdated = await addCurrentIpToDnsHistory( currentExternalIp );
        chainLog.push( `${timestampShortNow()} Update local DNS history: ${bUpdated}` );

      }

      // Play out the sync chain log.
      const firstLogging = chainLog.reduce(( accum, l ) => `${accum ? `${accum}\n` : ''}${l}`, '' );
      console.log( firstLogging );
    };

  } catch( e ) {
    console.log( `${timestampShortNow()} Chain error: ${e}` );
  }
}
syncDnsChainParent().then(() => {
  // DEBUG
  // console.log( `${timestampShortNow()} Chain done.` );
});
