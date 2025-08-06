const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
let token = '';
chai.use(chaiHttp);
const expect = chai.expect;

let api_url = "http://localhost:3003/api/fiu/v1"

// Scenario 1: Valid Consent Body
describe('Post Consent API Tests', function () {
    // this.timeout(30000); 

    // Test case for when token is invalid
    it('User receives an error if the token is invalid', function (done) {
        const consentBody = {
            "ConsentDetail": {
            }
        }

        chai.request(api_url)
            .post('/consent')
            .auth(token, { type: 'bearer' })
            .send(consentBody)
            .end(function (err, res) {
                if (err) return done(err);

                expect(res).to.have.status(401);
                // expect(res.body).to.have.property('error').that.includes('Invalid');
                done();
            });
    });

    it('should successfully post consent with valid details', async function () {
        const consentBody = {
            "ConsentDetail": {
            }
        }

        // eslint-disable-next-line no-useless-catch
        try {
            const res = await chai.request(api_url)
                .post('/consent')
                .auth(token, { type: 'bearer' })
                .send(consentBody);

            expect(res).to.have.status(200);
            console.log('Response Body:', res.body); // Log the response body
        } catch (err) {
            throw err;
        }
    });
});

// Scenario 2
it('should return a 400 error with invalid consent details', (done) => {
    let consentBody = {
        "ConsentDetail": {
        }
    }
    chai
        .request(api_url)
        .post('/consent')
        .auth(token, { type: 'bearer' })
        .send({
            consentBody
        })
        .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(400);
            // Insert assertions for no consent generation and no database storage
            done();
        });
});

// Scenario 3
it('should return a 400 error with empty body', (done) => {
    chai
        .request(api_url)
        .post('/consent')
        .auth(token, { type: 'bearer' })
        .send({})
        .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(400);
            // Insert assertions for no consent generation and no database storage
            done();
        });
});

// Scenario 4
it('should return a 400 error with duplicate transaction ID', (done) => {
    let consentBody = {
        "ConsentDetail": {
        }
    }
    chai
        .request(api_url)
        .post('/consent')
        .auth(token, { type: 'bearer' })
        .send({
            consentBody
        })
        .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(400);
            // Insert assertions for no consent generation and no database storage
            done();
        });
})