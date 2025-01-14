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
* Install this module globally
* a) You can clone the repository then do an [npm install -g]
* b) Or you can just do a global install [npm install -g cloudflare-sync-dns]
* Copy cloudflareSettings-template.json (in project folder) outside of the module to where you store configurations, and adjust accordingly
* Specify the settings file when you run, eg: cloudflare-sync-dns /path/to/my/settings.json
* Add a cron job to run the script regularly.  Every minute should work well, as most of the time it just does a local check.

NOTE that you can use this nvm-based bash script to run npm commands from cron:
```
#!/bin/bash
export NVM_DIR="/home/myhome/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
cloudflare-sync-dns /path/to/settings.json
```

[Documentation](https://bitpost.com/wiki/Cloudflare-sync-dns) | [News](https://bitpost.com/news)

Note there is also a command console for a few admin commands.

Usage: csd [command]

  cmd+options           short description
  ---------------------------------------
  sync                  [sy]  (admin-only) sync this module, ie: pull, commit, tag, push, publish to npm



Most recent commits...
  9efe6b8 5 minutes .. Comment on running node command from cron             HEAD -> mai.. Michael Behrns-Miller [cast]
  07607e7 15 minutes.. Comment on running node in cron                          tag: 6.1.2 Michael Behrns-Miller [cast]
  40947b7 23 minutes.. Allow for reset of firewall before accessing internet    tag: 6.1.1 Michael Behrns-Miller [cast]
  c77ca0a   2 days ago Another patch body bug fix                               tag: 6.1.0 Michael Behrns-Miller [cast]

Version 6.1.4
