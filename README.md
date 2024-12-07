# cloudflare-sync-dns

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
* Clone the repository
* Copy cloudflareSettings-template.json to cloudflareSettings.json and adjust accordingly
* Add a cron job to run the script regularly.  Every minute should work well, as most of the time it just does a local check.

[Documentation](https://bitpost.com/wiki/Cloudflare-sync-dns) | [News](https://bitpost.com/news)

Note there is also a command console for a few admin commands.

Usage: csd [command]

  cmd+options           short description
  ---------------------------------------
  sync                  [sy]  (admin-only) sync this module, ie: pull, commit, tag, push, publish to npm



Most recent commits...
  c24fa03   3 days ago Push to github Make github gitlab repos public        HEAD -> mai.. Michael Behrns-Miller [cob..
  1b7d707   3 days ago Update eslint dev dep                                    tag: 5.0.6 Michael Behrns-Miller [cob..
  cb69d64   3 days ago Update README                                            tag: 5.0.5 Michael Behrns-Miller [cob..
  3b5bf7e   3 days ago Import fixes                                             tag: 5.0.4 Michael Behrns-Miller [cob..

Version 5.0.8
