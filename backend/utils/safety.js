const readline = require('readline');

/**
 * PRODUCTION SAFETY GUARD (Rule 2 & 7)
 * Blocks execution in production unless --allow-prod is passed.
 * If --allow-prod is passed, requires typing DELETE_PRODUCTION_DATA.
 */
async function protectProduction() {
    const isProd = process.env.NODE_ENV === 'production';
    const hasAllowProd = process.argv.includes('--allow-prod');

    if (!isProd) return;

    if (!hasAllowProd) {
        console.error('\n❌ ERROR: DANGEROUS SCRIPT BLOCKED IN PRODUCTION.');
        console.log('To run this in production, you MUST use the --allow-prod flag.');
        process.exit(1);
    }

    // Check for dry run
    if (process.argv.includes('--dry-run')) {
        console.log('🛡️  Mode: PRODUCTION DRY RUN (No changes will be saved)');
        return;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const answer = await new Promise(resolve => {
            rl.question('\n⚠️  WARNING: YOU ARE ABOUT TO MODIFY/DELETE PRODUCTION DATA.\nType "DELETE_PRODUCTION_DATA" to continue: ', resolve);
        });

        if (answer !== 'DELETE_PRODUCTION_DATA') {
            console.log('❌ Confirmation failed. Aborting safety protocol.');
            process.exit(1);
        }
        console.log('✅ Confirmation verified. Proceeding with caution...');
    } finally {
        rl.close();
    }
}

module.exports = { protectProduction };
