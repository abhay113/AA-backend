const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
let token = '';

chai.use(chaiHttp);

let api_url = "http://localhost:3003/api/fiu/v1";
// eslint-disable-next-line no-undef
describe('GET /consentstatus/{consentHandle} API Tests', function () {
    // this.timeout(30000);

    // Test case for when token is invalid
    // eslint-disable-next-line no-undef
    it('Scenario 1: User receives an error if the token is invalid', function (done) {
        const validConsentHandle = '';

        chai.request(api_url)
            .get(`/consentstatus/${validConsentHandle}`)
            .auth(token, { type: 'bearer' })
            .end(function (err, res) {
                if (err) return done(err);

                expect(res).to.have.status(401);
                // expect(res.body).to.have.property('error').that.includes('Invalid');
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 2: Should return consent status for a valid consentHandle', async function () {
        const validConsentHandle = '';

        // eslint-disable-next-line no-useless-catch
        try {
            const res = await chai.request(api_url)
                .get(`/consentStatus/${validConsentHandle}`)
                .auth(token, { type: 'bearer' })
            expect(res).to.have.status(200);
            // console.log('Response Body:', res.body); // Log the response body
        } catch (err) {
            throw err;
        }
    });

     
// eslint-disable-next-line no-undef
    it('Scenario 3: Should return an error for an invalid consentHandle', () => {
        const invalidConsentHandle = '';

        chai.request(api_url)
            .get(`/consentstatus/${invalidConsentHandle}`)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                // console.log('Response Body:', res.body);
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error');
                expect(res.body.error).to.equal('invalid consent_id');
                // eslint-disable-next-line no-undef
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 4: Should return an error for an empty consentHandle', () => {
        const emptyConsentHandle = '';

        chai.request(api_url)
            .get(`/consentstatus/${emptyConsentHandle}`)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                // console.log('Response Body:', res.body);
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error');
                expect(res.body.error).to.equal('consent_id not found');
                // eslint-disable-next-line no-undef
                done();
            });
    });

});
