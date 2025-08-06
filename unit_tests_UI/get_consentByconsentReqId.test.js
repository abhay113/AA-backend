const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const app = 'http://localhost:3003/api/fiu/v1'; // Replace with your actual base URL
let token = '';
const expect = chai.expect;

// eslint-disable-next-line no-undef
describe('Consent Request ID API', () => {
    // eslint-disable-next-line no-undef
    describe('Retrieving consents by consent request ID', () => {
        // Test case for when token is invalid
        // eslint-disable-next-line no-undef
        it('User receives an error if the token is invalid', function (done) {
            let validConsentRequestId = ""
            
            chai.request(app)
            .get(`/consents/${validConsentRequestId}`)
                .auth(token, { type: 'bearer' })
                .end(function (err, res) {
                    if (err) return done(err);

                    expect(res).to.have.status(401);
                    // expect(res.body).to.have.property('error').that.includes('Invalid');
                    done();
                });
        });
        // eslint-disable-next-line no-undef
        it('should successfully retrieve consents by consent request ID', (done) => {
            let validConsentRequestId = ""

            chai
                .request(app)
                .get(`/consents/${validConsentRequestId}`)
                .auth(token, { type: 'bearer' })
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object'); // Adjust this as per your API response structure
                    done();
                });
        });

        // eslint-disable-next-line no-undef
        it('should return an error if the consent request ID does not exist', (done) => {
            let nonExistentConsentRequestId = ""

            chai
                .request(app)
                .get(`/consents/${nonExistentConsentRequestId}`)
                .auth(token, { type: 'bearer' })
                .end((err, res) => {
                    // console.log("RESPONSE", res.body)
                    expect(res).to.have.status(404);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });
        // eslint-disable-next-line no-undef
        it('should return an error if the server encounters an issue', (done) => {
            // Simulate a server issue here, if needed, within your API code
            // For example, by returning a 500 status code deliberately
            chai
                .request(app)
                .get(`/consents`)
                .auth(token, { type: 'bearer' })
                .end((err, res) => {
                    expect(res).to.have.status(500);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });
    });
});
