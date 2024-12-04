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

[Documentation](https://bitpost.com/wiki/Cloudflare-sync-dns) | [News](https://bitpost.com/news)

Note there is also a command console for a few admin commands.

Usage: csd [command]

  cmd+options           short description
  ---------------------------------------
  sync                  [sy]  (admin-only) sync this module, ie: pull, commit, tag, push, publish to npm



Most recent commits...
  1b7d707 17 minutes.. Update eslint dev dep                                 HEAD -> mai.. Michael Behrns-Miller [cob..
  cb69d64 45 minutes.. Update README                                            tag: 5.0.5 Michael Behrns-Miller [cob..
  3b5bf7e  2 hours ago Import fixes                                             tag: 5.0.4 Michael Behrns-Miller [cob..
  87074b3 13 hours ago First post                                            tag: 0.0.0,.. Michael Behrns-Miller [cob..

Version 5.0.7
