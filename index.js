const core = require('@actions/core');
const glob = require("glob");
const parser = require('xml-js');
const fs = require('fs');
const https = require('https');
async function run() {
    try {
        const globInput = core.getInput('glob');
        const labelInput = core.getInput('label');
        const files = glob.sync(globInput);
        let passedTests = 0;
        let failedTests = 0;
        for (let f of files) {
            const content = fs.readFileSync(f);
            const jsonData = parser.xml2js(content, { compact: true, spaces: 2 });
            const counters = jsonData.TestRun.ResultSummary.Counters._attributes;
            passedTests += parseInt(counters.passed);
            failedTests += parseInt(counters.failed);
        }
        const color = failedTests ? 'critical' : 'success';
        const message = `${passedTests} passed, ${failedTests} failed`;
        console.log(color);
        console.log(message);
        const promise = new Promise(resolve => {
            let data = '';
            https.get(`https://img.shields.io/badge/${labelInput}-${message}-${color}`, response => {
                response.on('data', chunk => { data += chunk })
                response.on('end', () => {
                    console.log('SVG from img.shields.io');
                    console.log(data);
                    const filePath = 'test-badge.svg';
                    console.log('writing to ' + filePath);
                    fs.writeFileSync(filePath, data);
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
