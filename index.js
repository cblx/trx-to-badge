const core = require('@actions/core');
const glob = require("glob");
const parser = require('xml-js');
const fs = require('fs');
const https = require('https');
async function run() {
    try {
        const globInput = core.getInput('glob');
        const titleInput = core.getInput('title');
        const files = glob.sync(globInput);
        let passedTests = 0;
        let failedTests = 0;
        for (let f of files) {
            const content = fs.readFileSync(f);
            const jsonData = parser.xml2js(content, { compact: true, spaces: 2 });
            console.log(jsonData);
            const counters = jsonData.resultSummary.counters;
            passedTests += counters.passed;
            failedTests += counters.failed;
        }
        const color = failedTests ? 'critical' : 'success';
        const message = `${passedTests} passed, ${failedTests} failed`;
        const promise = new Promise(r => {
            let data = '';
            https.get(`https://img.shields.io/badge/${titleInput}-${message}-${color}`, res => {
                res.on('data', chunk => { data += chunk })
                res.on('end', () => {
                    fs.writeFileSync('test-badge.svg', data);
                    resolve();
                })
            });
        });
        await promise;
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();