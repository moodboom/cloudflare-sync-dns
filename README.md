# cloudflare-sync-dns
This node script can be called regularly (e.g. via cron) to keep your DNS records up to date when your ISP assigns you a new IP address.

Specifically, the script will:

1) maintain a local copy of the IP that was last set in your cloudflare DNS records
2) check your external IP address, comparing it to the cloudflare DNS record
3) if the external IP has changed:
* load cloudflare settings and keys from a local JSON file
* call the cloudflare API to get all DNS record ids
* call the cloudflare API for each DNS record and update it to the new external IP
* optionally run firewall and LAN scripts, and ensure all hosts are resolving 
* only after everything is verified, update the local copy of the IP

See https://bitpost.com/news/1234 for documentation.

See https://bitpost.com/news/1234 for the latest news.


Most recent commits...
  4dae181 2 months ago Allow for larger hashes in git-log                    HEAD -> mas.. Michael Behrns-Miller [cast]
  59a7392 8 months ago dep crawl                                               tag: 0.0.32 Michael Behrns-Miller [abt..
  2dd3df4 8 months ago Minor npm deps ripple                                   tag: 0.0.31 Michael Behrns-Miller [abt..
  acf6986 8 months ago Do not chdir in git_remote_changes                      tag: 0.0.30 Michael Behrns-Miller [abt..

Version 0.0.34
