export function vehicleUrl(name) {
  return '/vehicle?v=' + encodeURIComponent(name);
}

export function agencyUrl(code) {
  return '/agency?a=' + encodeURIComponent(code);
}

export function siteUrl(code) {
  return '/site?s=' + encodeURIComponent(code);
}
