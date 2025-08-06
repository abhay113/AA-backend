const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';

let aggragatorId = "" // replace with actual value

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Feature: Updating aggregator status by aggregator ID', function () {
  const body = { "status" : ""}
// eslint-disable-next-line no-undef
  it('Scenario: should successfully update aggregator status by aggragator ID', function (done) {
   
    chai
      .request(app)
      .put(`/aggregator/status/${aggragatorId}`)
      .send(body)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('Scenario: should receives an error if the aggregator ID is not valid', function (done) {
    const invalidaggragatorId = ''
    chai
      .request(app)
      .put(`/aggregator/status/${invalidaggragatorId}`)
      .send(body)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(404); // can be 400 or 404
        expect(res.body).to.have.property('error');
        done();
      });
  })
// eslint-disable-next-line no-undef
  it('Scenario: should receives an error if the request body is not in the correct format', function (done) {
    const invalidaggragatorId = ''
    chai
      .request(app)
      .put(`/aggregator/status/${invalidaggragatorId}`)
      .send({ invalidField: 'invalidValue' })
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error');
        done();
      });
  })
// eslint-disable-next-line no-undef
  it('Scenario: should receives an error if the server encounters an issue', function (done) {

    chai
      .request(app)
      .put(`/aggregator/status/${aggragatorId}`)
      .send(body)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
