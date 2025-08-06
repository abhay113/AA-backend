const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
let token = '';
let api_url = "http://localhost:3003/api/fiu/v1"
let api_path = "/fi/request"

chai.use(chaiHttp);
const expect = chai.expect;

describe('POST /fi/request/:consentHandle API', function () {
    // this.timeout(40000)

    // Test case for when token is invalid
    it('User receives an error if the token is invalid', function (done) {
        const validConsentHandle = '';

        chai.request(api_url)
        .post(api_path + `/${validConsentHandle}`)
            .auth(token, { type: 'bearer' })
            .end(function (err, res) {
                if (err) return done(err);

                expect(res).to.have.status(401);
                // expect(res.body).to.have.property('error').that.includes('Invalid');
                done();
            });
    });

    it('should generate FI request with valid consentHandle and store in the database', async function () {
        const validConsentHandle = "";
        // eslint-disable-next-line no-useless-catch
        try {
            const res = await chai
                .request(api_url)
                .post(api_path + `/${validConsentHandle}`)
                .auth(token, { type: 'bearer' })
            expect(res).to.have.status(200);
        } catch (err) {
            throw err;
        }
    });

    // Scenario 2
    it('should return 400 for invalid consentHandle', (done) => {
        const invalidConsentHandle = "";
        chai
            .request(api_url)
            .post(api_path + `/${invalidConsentHandle}`)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
    });

    // Scenario 3
    it('should return 400 for empty path', (done) => {
        chai
            .request(api_url)
            .post(api_path)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
    });
});
