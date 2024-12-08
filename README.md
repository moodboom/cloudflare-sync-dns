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
* a) You can clone the repository then do an [npm install -g]
* b) Or you can just do a global install [npm install -g cloudflare-sync-dns].
* In the module root, copy cloudflareSettings-template.json to cloudflareSettings.json and adjust accordingly
* Add a cron job to run the script regularly.  Every minute should work well, as most of the time it just does a local check.

[Documentation](https://bitpost.com/wiki/Cloudflare-sync-dns) | [News](https://bitpost.com/news)

Note there is also a command console for a few admin commands.

Usage: csd [command]

  cmd+options           short description
  ---------------------------------------
  sync                  [sy]  (admin-only) sync this module, ie: pull, commit, tag, push, publish to npm



Most recent commits...
  ca6e35d  9 hours ago Better error on missing settings file                 HEAD -> mai.. Michael Behrns-Miller [cob..
  aa57fff  9 hours ago Final generification                                     tag: 5.0.9 Michael Behrns-Miller [cob..
  7e86076 10 hours ago Adding missing bits                                      tag: 5.0.8 Michael Behrns-Miller [cob..
  c24fa03   3 days ago Push to github Make github gitlab repos public           tag: 5.0.7 Michael Behrns-Miller [cob..

Version 5.0.11
