locals {
  site_aliases = distinct(concat([var.site_domain], var.site_aliases))
  site_origins = [for alias in local.site_aliases : "https://${alias}"]
}
