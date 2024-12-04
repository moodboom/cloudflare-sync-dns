#!/usr/bin/env node

import { DateTime } from 'luxon';
import fs from 'fs';
import * as rs from 'rad-scripts';
import { getPublicIp, callApi } from './utils.js';

const baseUrl = 'https://api.cloudflare.com/client/v4/zones';

const timestampShort = timestamp => timestamp.toLocaleString( DateTime.DATETIME_SHORT );
const timestampShortNow = () => timestampShort( DateTime.now());

// If not on bitpost, log and exit.
if ( rs.hostname() !== 'bitpost' ) {
  console.log( `This script is only intended to run on bitpost, not ${rs.hostname()}.` );
  process.exit( 1 );
}

// WE NEED A MASTER SYNC CHAIN FUNCTION.
// See Javascript scrap for the initial sync chain skeleton, fun!
// We will use a chain of promise functions that do the work and "resolve" when done.
// NOTE I was thinking we could do some fun async parallel scripting.
// But it turned out we need it all to be sync this time.
// NOTE that any errors should be generally reported, and will short-circuit the chain completion.
// If no update is needed, nothing is returned so that cron does not send an email.

const historyFile = '/home/m/config/home/m/dnsHistory.json';
const cloudflareSettingsFile = '/home/m/config/home/m/cloudflareSettings.json';

const createDnsHistoryAsNeeded = async () => {
  return new Promise(( resolve, reject ) => {
    if ( !rs.file_exists( historyFile )) {
      const initialHistory = [{ ip: '0.0.0.0', date: timestampShortNow() }];
      fs.writeFileSync( historyFile, JSON.stringify( initialHistory ), 'utf-8' );
      resolve( true );
    }
    resolve( false );
  });
}

const loadDnsHistory = async () => {
  return new Promise(( resolve, reject ) => {
    try {
      const historyFileString = fs.readFileSync( historyFile, 'utf8' );
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
      const cloudflareSettingsFileString = fs.readFileSync( cloudflareSettingsFile, 'utf8' );
      const s = JSON.parse( cloudflareSettingsFileString );
      if ( !( s?.accountAPIKey  && s?.accountEmail && s?.zoneIds?.length )) {
        reject( 'Your cloudflareSettings.JSON file does not contain all required settings.' );
      }
      resolve( s );
    }
    catch( e ) {
      console.log( 'loadCloudflareSettings error', e );
      reject( e );
    }
  });
}

// GET DNS RECORDS
// We GET DNS records first, so we can later use the dns_record_ids to update IP.
const getDnsRecords = async ({ domain, zoneId }) => {
  return new Promise(( resolve, reject ) => {

    // We just want A records, which contain the IP address of the domain.
    // Note that there are many filtering options available, KISS.
    // const aFilter = 'type=A&match=any&order=type&direction=desc&per_page=100&page=1';
    const aFilter = 'type=A&match=any&order=type&direction=desc';
    const zoneGetUrl = `${baseUrl}/${zoneId}/dns_records?${aFilter}`;

    // TOTHINK: Account (all domains) vs zone (one domain!)
    // const accountGetUrl = `${baseUrl}/dns_records?account.id=${accountId}&${aFilter}`;

    const headers = {
      'X-Auth-Key': accountAPIKey,
      'X-Auth-Email': accountEmail,

      // 2024/11/13 I COULD NOT GET THIS GOING for v4 at this time.
      // Even tho cloudflare recommends it, none of their docs are updated to use it.
      // Also, it does not work and the "old" key+email way does.  lol
      // 'Authorization': `Bearer ${cloudflareAPIToken}`,
    };
    // -----------------

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

const updateDns = async ({ currentExternalIp, dnsRecord }) => {
  return new Promise(( resolve, reject ) => {

    const baseUrl = 'https://api.cloudflare.com/client/v4/zones';

    const headers = {
      'X-Auth-Key': accountAPIKey,
      'X-Auth-Email': accountEmail,

      // 2024/11/13 I COULD NOT GET THIS GOING for v4 at this time.
      // Even tho cloudflare recommends it, none of their docs are updated to use it.
      // Also, it does not work and the "old" key+email way does.  lol
      // 'Authorization': `Bearer ${cloudflareAPIToken}`,
    };
    // -----------------

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

const resetLan = async () => {
  return new Promise(( resolve, reject ) => {

    // 1 reset firewall with new IP
    rs.run_command_sync_to_console(
      'sudo bash /home/m/scripts/ubuntu/bitpost/root/stronger_firewall_and_save',
    );

    // 2 verify we can ping both externally and internally
    const bLanOk = rs.ping_google() && rs.ping( 'cast' ) && rs.ping( 'bandit' );

    resolve( bLanOk );
  });
}

const addCurrentIpToDnsHistory = async currentExternalIp => {
  return new Promise(( resolve, reject ) => {
    try {
      const historyFileString = fs.readFileSync( historyFile, 'utf8' );
      const h = JSON.parse( historyFileString );
      h.push({
        ip: currentExternalIp,
        date: timestampShortNow(),
      });
      fs.writeFileSync( historyFile, JSON.stringify( h, null, 2 ), 'utf-8' );
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

    const currentExternalIp = await getPublicIp();
    chainLog.push( `${timestampShortNow()} External IP: ${ currentExternalIp }` );

    const bCreated = await createDnsHistoryAsNeeded();
    chainLog.push( `${timestampShortNow()} Create history as needed: ${bCreated}` );

    const lastDnsIp = await loadDnsHistory();
    chainLog.push( `${timestampShortNow()} Load last: ${lastDnsIp}` );

    if ( currentExternalIp !== lastDnsIp ) {

      // NOTE LOOPS with await cannot use forEach.
      // Simply use a normal for.
      let dnsRecords = [];
      for ( const z of zoneIds ) {
        const dnsZoneRecords = await getDnsRecords( z );
        dnsRecords = dnsRecords.concat( dnsZoneRecords );
      };
      chainLog.push( `${timestampShortNow()} Got ${dnsRecords.length} DNS records` );

      let bUpdateOk = true;
      for ( const dnsRecord of dnsRecords ) {

        const bOk = await updateDns({ currentExternalIp, dnsRecord });
        chainLog.push( `${timestampShortNow()} Updated ${ dnsRecord.name } to IP ${currentExternalIp}` );

        bUpdateOk = bUpdateOk && bOk;
      };
      chainLog.push( `${timestampShortNow()} Update all DNS records: ${bUpdateOk}` );

      const bLanOk = await resetLan();
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


// ---------
// APPENDIX
// ---------

// ---------------------
// TYPICAL DNS API RESPONSE:
// ---------------------
// {
//   result: [
//     {
//       id: 'c5b5fcf322a08e38dcabc49f88d4ac3b',
//       zone_id: 'e33cb4e6a4dc8c73ab0111efe6911d3a',
//       zone_name: 'bitpost.com',
//       name: 'bitpost.com',
//       type: 'A',
//       content: '136.47.189.8',
//       proxiable: true,
//       proxied: false,
//       ttl: 1,
//       settings: {},
//       "meta":{"auto_added":false,"managed_by_apps":false,"managed_by_argo_tunnel":false},
//       comment: null,
//       tags: [],
//       created_on: '2023-10-23T20:55:39.313387Z',
//       modified_on: '2024-11-08T05:13:44.173422Z'
//     }
//   ],
//   success: true,
//   errors: [],
//   messages: [],
//   result_info: { page: 1, per_page: 100, count: 1, total_count: 1, total_pages: 1 }
// }
// ---------------------

