#!/usr/bin/env node

import { csd } from './csd.js';

// 0 = node, 1 = script path, so we ignore those.
// 2 = target command (run [es] for details)
const target = process.argv[ 2 ];
const args = process.argv.slice( 3 );
csd( target,args );
