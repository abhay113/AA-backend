const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

let api_url = "http://localhost:3003/api/fiu/v1"; // Update with your API URL
// eslint-disable-next-line no-undef
describe('GET /FI/decrypt/{sessionId} API Tests', () => {
    // eslint-disable-next-line no-undef
    it('Scenario 1: Should decrypt FI data for a valid sessionId ', (done) => {
        const validSessionId = ''; // Replace with a valid sessionId

        chai.request(api_url)
            .get(`/FI/decrypt/${validSessionId}`)
            .end((err, res) => {
                // console.log('Response Body:', res.body);
                expect(res).to.have.status(200);
                done();
            });
    });
    // eslint-disable-next-line no-undef
    it('Scenario 2: Should return an error for an invalid sessionId', (done) => {
        const invalidSessionId = ''; // Replace with an invalid sessionId

        chai.request(api_url)
            .get(`/FI/decrypt/${invalidSessionId}`)
            .end((err, res) => {
                // console.log('Response Body:', res.body);
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                // Add assertions to verify that FI data is not received and not stored in the database
                done();
            });
    });
    // eslint-disable-next-line no-undef
    it('Scenario 3: Should return an error for an empty sessionId', (done) => {
        const emptySessionId = ''; // Replace with an empty sessionId

        chai.request(api_url)
            .get(`/FI/decrypt/${emptySessionId}`)
            .end((err, res) => {
                // console.log('Response Body:', res.body);
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                // Add assertions to verify that FI data is not received and not stored in the database
                done();
            });
    });
});
