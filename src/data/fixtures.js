// Synthetic launch data for tests — ~20 rows covering edge cases.
// Outcome codes: OS/DS → Success, OF → Failure, XS → Suborbital, null → Unknown

function makeDate(year, month, day) {
  return new Date(year, month - 1, day);
}

// launches: one row per launch (unique Launch_Tag)
export const launches = [
  { Launch_Tag: 'L001', Launch_Date: '2000 Jan 15', LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas', Launch_Site: 'CCAS', Launch_Pad: 'LC17', Launch_Code: 'OS',  date: makeDate(2000,1,15), year: 2000, outcome: 'Success',    payloadCount: 2 },
  { Launch_Tag: 'L002', Launch_Date: '2000 Mar 22', LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas', Launch_Site: 'CCAS', Launch_Pad: 'LC17', Launch_Code: 'OF',  date: makeDate(2000,3,22), year: 2000, outcome: 'Failure',    payloadCount: 1 },
  { Launch_Tag: 'L003', Launch_Date: '2001 Jun 10', LVState: 'US', Agency: 'ULA',  LV_Type: 'Delta',  Launch_Site: 'VAFB', Launch_Pad: 'SLC2', Launch_Code: 'DS',  date: makeDate(2001,6,10), year: 2001, outcome: 'Success',    payloadCount: 1 },
  { Launch_Tag: 'L004', Launch_Date: '2001 Sep  5', LVState: 'RU', Agency: 'RKA',  LV_Type: 'Soyuz',  Launch_Site: 'BKOS', Launch_Pad: 'LC1',  Launch_Code: 'OS',  date: makeDate(2001,9,5),  year: 2001, outcome: 'Success',    payloadCount: 3 },
  { Launch_Tag: 'L005', Launch_Date: '2002 Feb 28', LVState: 'RU', Agency: 'RKA',  LV_Type: 'Soyuz',  Launch_Site: 'BKOS', Launch_Pad: 'LC1',  Launch_Code: 'OF',  date: makeDate(2002,2,28), year: 2002, outcome: 'Failure',    payloadCount: 1 },
  { Launch_Tag: 'L006', Launch_Date: '2002 Jul 19', LVState: 'CN', Agency: 'CNSA', LV_Type: 'CZ-2',   Launch_Site: 'JSLC', Launch_Pad: 'LC1',  Launch_Code: 'OS',  date: makeDate(2002,7,19), year: 2002, outcome: 'Success',    payloadCount: 1 },
  { Launch_Tag: 'L007', Launch_Date: '2003 Apr 11', LVState: 'CN', Agency: 'CNSA', LV_Type: 'CZ-2',   Launch_Site: 'JSLC', Launch_Pad: 'LC1',  Launch_Code: 'OS',  date: makeDate(2003,4,11), year: 2003, outcome: 'Success',    payloadCount: 2 },
  { Launch_Tag: 'L008', Launch_Date: '2003 Nov  3', LVState: 'US', Agency: 'ULA',  LV_Type: 'Delta',  Launch_Site: 'VAFB', Launch_Pad: 'SLC2', Launch_Code: 'XS',  date: makeDate(2003,11,3), year: 2003, outcome: 'Suborbital', payloadCount: 1 },
  { Launch_Tag: 'L009', Launch_Date: '2004 Jan 29', LVState: 'US', Agency: 'SpaceX',LV_Type: 'Falcon', Launch_Site: 'CCAS', Launch_Pad: 'LC40', Launch_Code: 'OS',  date: makeDate(2004,1,29), year: 2004, outcome: 'Success',    payloadCount: 1 },
  { Launch_Tag: 'L010', Launch_Date: '2004 Aug 14', LVState: 'US', Agency: 'SpaceX',LV_Type: 'Falcon', Launch_Site: 'CCAS', Launch_Pad: 'LC40', Launch_Code: 'OS2', date: makeDate(2004,8,14), year: 2004, outcome: 'Success',    payloadCount: 4 },
  { Launch_Tag: 'L011', Launch_Date: '2004 Oct  7', LVState: 'RU', Agency: 'RKA',  LV_Type: 'Proton',  Launch_Site: 'BKOS', Launch_Pad: 'LC81', Launch_Code: 'OF1', date: makeDate(2004,10,7), year: 2004, outcome: 'Failure',    payloadCount: 1 },
  { Launch_Tag: 'L012', Launch_Date: '2005 May 30', LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas',  Launch_Site: 'CCAS', Launch_Pad: 'LC17', Launch_Code: 'OS',  date: makeDate(2005,5,30), year: 2005, outcome: 'Success',    payloadCount: 1 },
  { Launch_Tag: 'L013', Launch_Date: '2005 Aug 22', LVState: 'US', Agency: 'ULA',  LV_Type: 'Delta',  Launch_Site: 'CCAS', Launch_Pad: 'LC17', Launch_Code: 'OS',  date: makeDate(2005,8,22), year: 2005, outcome: 'Success',    payloadCount: 2 },
  { Launch_Tag: 'L014', Launch_Date: '2005 Dec  1', LVState: 'CN', Agency: 'CNSA', LV_Type: 'CZ-3',   Launch_Site: 'XSLC', Launch_Pad: 'LC3',  Launch_Code: 'OF',  date: makeDate(2005,12,1), year: 2005, outcome: 'Failure',    payloadCount: 1 },
  { Launch_Tag: 'L015', Launch_Date: null,           LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas',  Launch_Site: 'CCAS', Launch_Pad: 'LC17', Launch_Code: null,  date: null,                year: null, outcome: 'Unknown',    payloadCount: 1 },
  { Launch_Tag: 'L016', Launch_Date: '2003 Apr 15', LVState: 'US', Agency: 'SpaceX',LV_Type: 'Falcon', Launch_Site: 'CCAS', Launch_Pad: 'LC40', Launch_Code: 'XS',  date: makeDate(2003,4,15), year: 2003, outcome: 'Suborbital', payloadCount: 1 },
  { Launch_Tag: 'L017', Launch_Date: '2001 Mar  8', LVState: 'EU', Agency: 'ESA',  LV_Type: 'Ariane',  Launch_Site: 'CSG',  Launch_Pad: 'ELA3', Launch_Code: 'DS',  date: makeDate(2001,3,8),  year: 2001, outcome: 'Success',    payloadCount: 2 },
  { Launch_Tag: 'L018', Launch_Date: '2002 Nov 12', LVState: 'EU', Agency: 'ESA',  LV_Type: 'Ariane',  Launch_Site: 'CSG',  Launch_Pad: 'ELA3', Launch_Code: 'OS',  date: makeDate(2002,11,12),year: 2002, outcome: 'Success',    payloadCount: 1 },
  { Launch_Tag: 'L019', Launch_Date: '2004 Mar  5', LVState: 'EU', Agency: 'ESA',  LV_Type: 'Ariane',  Launch_Site: 'CSG',  Launch_Pad: 'ELA3', Launch_Code: 'OS',  date: makeDate(2004,3,5),  year: 2004, outcome: 'Success',    payloadCount: 3 },
  { Launch_Tag: 'L020', Launch_Date: '2005 Jul 18', LVState: 'RU', Agency: 'RKA',  LV_Type: 'Proton',  Launch_Site: 'BKOS', Launch_Pad: 'LC81', Launch_Code: 'OS',  date: makeDate(2005,7,18), year: 2005, outcome: 'Success',    payloadCount: 2 },
];

// payloads: multiple rows may share a Launch_Tag
export const payloads = [
  { Launch_Tag: 'L001', Name: 'Hubble-A', PLName: 'HUBBLE A', LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas', Launch_Site: 'CCAS', Launch_Pad: 'LC17', year: 2000 },
  { Launch_Tag: 'L001', Name: 'Hubble-B', PLName: 'HUBBLE B', LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas', Launch_Site: 'CCAS', Launch_Pad: 'LC17', year: 2000 },
  { Launch_Tag: 'L002', Name: 'Comsat-1', PLName: 'COMSAT 1', LVState: 'US', Agency: 'NASA', LV_Type: 'Atlas', Launch_Site: 'CCAS', Launch_Pad: 'LC17', year: 2000 },
  { Launch_Tag: 'L003', Name: 'Scout',    PLName: 'SCOUT',    LVState: 'US', Agency: 'ULA',  LV_Type: 'Delta', Launch_Site: 'VAFB', Launch_Pad: 'SLC2', year: 2001 },
  { Launch_Tag: 'L009', Name: 'Dragon-1', PLName: 'DRAGON 1', LVState: 'US', Agency: 'SpaceX',LV_Type: 'Falcon',Launch_Site: 'CCAS', Launch_Pad: 'LC40', year: 2004 },
];
