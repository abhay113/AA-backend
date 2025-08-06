const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';
let aggragatorId = "" // replace with actual value
let invalidAggragatorId = "" 

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Feature: set default aggregator by aggregator ID', function () {
  // const body = { "status" : ""}
// eslint-disable-next-line no-undef
  it('Scenario: should successfully set default aggregator by aggragator ID', function (done) {
   
    chai
      .request(app)
      .put(`/aggregator/setDefault/${aggragatorId}`)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(200);
        console.log(res.data)
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('Scenario: should receives an error if the aggregator ID is not valid', function (done) {
    chai
      .request(app)
      .put(`/aggregator/setDefault/${invalidAggragatorId}`)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(404); //can be 400 or 404
        done();
      });
  })
// eslint-disable-next-line no-undef
  it('Scenario: should receives an error if the server encounters an issue', function (done) {

    chai
      .request(app)
      .put(`/aggregator/setDefault/${invalidAggragatorId}`)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
