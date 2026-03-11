import { describe, it, expect } from 'vitest';
import { vehicleUrl, agencyUrl, siteUrl, countryUrl } from './navigation.js';

describe('vehicleUrl', () => {
  it('builds basic URL', () => {
    expect(vehicleUrl('Atlas')).toBe('/vehicle?v=Atlas');
  });

  it('encodes spaces', () => {
    expect(vehicleUrl('Falcon 9')).toBe('/vehicle?v=Falcon%209');
  });

  it('encodes slashes', () => {
    expect(vehicleUrl('CZ-2C/SD')).toBe('/vehicle?v=CZ-2C%2FSD');
  });

  it('encodes parentheses', () => {
    expect(vehicleUrl('Vostok (8K72K)')).toBe('/vehicle?v=Vostok%20(8K72K)');
  });

  it('encodes ampersand', () => {
    expect(vehicleUrl('A&B')).toBe('/vehicle?v=A%26B');
  });
});

describe('agencyUrl', () => {
  it('builds basic URL', () => {
    expect(agencyUrl('NASA')).toBe('/agency?a=NASA');
  });

  it('encodes special characters', () => {
    expect(agencyUrl('ISRO/DOS')).toBe('/agency?a=ISRO%2FDOS');
  });
});

describe('siteUrl', () => {
  it('builds basic URL', () => {
    expect(siteUrl('CCAS')).toBe('/site?s=CCAS');
  });

  it('encodes special characters', () => {
    expect(siteUrl('KY+1')).toBe('/site?s=KY%2B1');
  });
});

describe('countryUrl', () => {
  it('builds basic URL', () => {
    expect(countryUrl('US')).toBe('/country?c=US');
  });

  it('encodes special characters', () => {
    expect(countryUrl('X&Y')).toBe('/country?c=X%26Y');
  });
});
