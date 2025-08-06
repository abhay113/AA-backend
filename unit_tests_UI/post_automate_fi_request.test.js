const chai = require('chai');
const chaiHttp = require('chai-http');
const { describe, it } = require('mocha');
let token = '';

let api_url = "http://localhost:3003/api/fiu/v1"
let api_path = "/automation/fi/request"

chai.use(chaiHttp);
const expect = chai.expect;

describe('POST /automation/fi/request API', function () {
    // this.timeout(40000)

    // Test case for when token is invalid
    // it('User receives an error if the token is invalid', function (done) {

    //     chai
    //         .request(api_url)
    //         .post(api_path)
    //         .auth(token, { type: 'bearer' })
    //         .query({ config_id: "" })
    //         .send({ fi_request: "" })
    //         .end(function (err, res) {
    //             if (err) return done(err);

    //             expect(res).to.have.status(401);
    //             // expect(res.body).to.have.property('error').that.includes('Invalid');
    //             done();
    //         });
    // });
    // eslint-disable-next-line no-undef
    it('should automate FI request with valid config id', async function () {
        // eslint-disable-next-line no-useless-catch
        try {
            const body = {}
            const res = await chai
                .request(api_url)
                .post(api_path)
                .auth(token, { type: 'bearer' })
                .query({ config_id: "" }) //replace with valid config id
                .send({ fi_request: body })
            expect(res).to.have.status(200);
        } catch (err) {
            throw err;
        }
    });

    // Scenario 2
    it('should return 400 for invalid config id', (done) => {
        chai
            .request(api_url)
            .post(api_path)
            .auth(token, { type: 'bearer' })
            .query({ config_id: "" })
            .send({ fi_request: "" })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
    });

    // Scenario 3
    it('should return 400 for empty params', (done) => {
        chai
            .request(api_url)
            .post(api_path)
            .auth(token, { type: 'bearer' })
            .query({ config_id: "" })
            .send({ fi_request: "" })
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                done();
            });
    });
});
