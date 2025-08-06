const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
let token = '';
chai.use(chaiHttp);

let api_url = "http://localhost:3003/api/fiu/v1";

// eslint-disable-next-line no-undef
describe('GET /consent/{consent_id} API Tests', () => {
    // this.timeout(30000);
     // Test case for when token is invalid
     // eslint-disable-next-line no-undef
     it('Scenario 1: User receives an error if the token is invalid', function (done) {
        const validConsentId = '';
        console.log('consent id url',api_url + `/consent/${validConsentId}`);
        chai.request(api_url)
        .get(`/consent/${validConsentId}`)
            .auth(token, { type: 'bearer' })
            .end(function (err, res) {
                if (err) return done(err);
                
                expect(res).to.have.status(401);
                // expect(res.body).to.have.property('error').that.includes('Invalid');
                done();
            });
    });

    // eslint-disable-next-line no-undef
    it('Scenario 2: Should return consent details for a valid consent_id', function (done) {
        const validConsentId = ''; 

        chai.request(api_url)
            .get(`/consent/${validConsentId}`)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(200);
                done();
            });
    });
// eslint-disable-next-line no-undef
    it('Scenario 3: Should return an error for an invalid consent_id', (done) => {
        const invalidConsentId = ''; // Replace with an invalid consent_id

        chai.request(api_url)
            .get(`/consent/${invalidConsentId}`)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                console.log('Response Body:', res.body);
                expect(res).to.have.status(400); // or 404, depending on your expected behavior
                expect(res.body).to.have.property('error');
                expect(res.body.error).to.equal('invalid consent_id'); // Adjust the error message as needed
                done();
            });
    });
});
