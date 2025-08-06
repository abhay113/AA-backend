const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';
// const token = '' //replace wtih valid token
let aggragatorId = '' //replace with valid id
let invalidAggregatorId = ''

chai.use(chaiHttp);
const expect = chai.expect;

// eslint-disable-next-line no-undef
describe('Feature: Retrieving a list of all aggregators by aggregator ID', function () {

  // eslint-disable-next-line no-undef
  it('Scenario: User successfully retrieves a list of all aggregators by aggragator ID', function (done) {

    chai
      .request(app)
      .get(`/aggregator/${aggragatorId}`)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });

  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the aggregator ID is not valid', function (done) {
    chai
      .request(app)
      .get(`/aggregators/${invalidAggregatorId}`)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(404); // can be 400 or 404 (data not found/invalid request)
        done();
      });
  })

  // eslint-disable-next-line no-undef
  it('Scenario: User receives an error if the server encounters an issue', function (done) {

    chai
      .request(app)
      .get(`/aggregators/${aggragatorId}`)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
