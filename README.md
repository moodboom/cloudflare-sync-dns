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

[Documentation](https://bitpost.com/wiki/Cloudflare-sync-dns) | [News](https://bitpost.com/news)

Note there is also a command console for a few admin commands.

Usage: csd [command]

  cmd+options           short description
  ---------------------------------------
  sync                  [sy]  (admin-only) sync this module, ie: pull, commit, tag, push, publish to npm



Most recent commits...
  ea10ca3 4 minutes .. Fatal PATCH body bug FIXED tested and working         HEAD -> mai.. Michael Behrns-Miller [cast]
  8d9060a 41 minutes.. Fatal bad-url bug FIXED                                  tag: 5.1.0 Michael Behrns-Miller [cast]
  62b306a 48 minutes.. Catch API call errors and terminate                     tag: 5.0.20 Michael Behrns-Miller [cast]
  62e1933 52 minutes.. Catch API call errors                                   tag: 5.0.19 Michael Behrns-Miller [cast]

Version 6.1.0
