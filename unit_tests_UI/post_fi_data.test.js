const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

let api_url = "http://localhost:3003/api/fiu/v1"; // Update with your API URL
// eslint-disable-next-line no-undef
describe('POST /fi/data/{sessionId} API Tests', () => {
    // this.timeout(50000);
    const body = {
        "ver": "1.1.2",
        "timestamp": "2024-01-19T13:05:33.420Z",
        "txnid": "", //replace with valid value
        "FI": [
            {
                "fipID": "", ///replace with valid value
                "data": [
                    {
                        "linkRefNumber": "", //replace with valid value
                        "maskedAccNumber": "", //replace with valid value,
                        "encryptedFI": ""
                    },
                    {
                        "linkRefNumber": "",
                        "maskedAccNumber": "",
                        "encryptedFI": ""
                    }
                ],
                "KeyMaterial": {} //replace with valid value
            }
        ]
    }
// eslint-disable-next-line no-undef
    it('Scenario 1: Should return FI data for a valid sessionId ', (done) => {
        const validSessionId = ''; // Replace with a valid sessionId

        chai.request(api_url)
            .post(`/fi/data/${validSessionId}`)
            .send(body)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(200);
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 2: Should return an error for an invalid sessionId', (done) => {
        const invalidSessionId = ''; // Replace with an invalid sessionId

        chai.request(api_url)
            .post(`/fi/data/${invalidSessionId}`)
            .send(body)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                // Add assertions to verify that FI data is not received and not stored in the database
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 3: Should return an error for an empty sessionId', (done) => {
        const emptySessionId = ''; // Replace with an empty sessionId

        chai.request(api_url)
            .post(`/fi/data/${emptySessionId}`)
            .send(body)
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                // Add assertions to verify that FI data is not received and not stored in the database
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 3: Should return an error for an empty body', (done) => {
        const emptySessionId = ''; // Replace with an empty sessionId

        chai.request(api_url)
            .post(`/fi/data/${emptySessionId}`)
            .send({})
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                // Add assertions to verify that FI data is not received and not stored in the database
                done();
            });
    });
});
