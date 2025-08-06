const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';
let token = '';
chai.use(chaiHttp);
const expect = chai.expect;

// eslint-disable-next-line no-undef
describe('Product Deletion API', () => {

    const validProductId = '';
    const invalidProductId = '';
    // const nonExistentProductId = '';

     // Test case for when token is invalid
     // eslint-disable-next-line no-undef
     it('User receives an error if the token is invalid', function (done) {

        chai.request(app)
        .delete(`/products/${invalidProductId}`)
            .auth(token, { type: 'bearer' })
            .end(function (err, res) {
                if (err) return done(err);

                expect(res).to.have.status(401);
                // expect(res.body).to.have.property('error').that.includes('Invalid');
                done();
            });
    });

    // eslint-disable-next-line no-undef
    it('should successfully delete a product by its ID', async function () {
        // eslint-disable-next-line no-useless-catch
        try {
            const res = await chai
                .request(app)
                .delete(`/products/${validProductId}`)
                .auth(token, { type: 'bearer' })
            expect(res).to.have.status(200);
        } catch (err) {
            throw err;
        }
    });

    // eslint-disable-next-line no-undef
    it('should return an error if the product ID is invalid', (done) => {
        chai
            .request(app)
            .delete(`/products/${invalidProductId}`)
            .auth(token, { type: 'bearer' })
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error');
                done();
            });
    });

    // eslint-disable-next-line no-undef
    it('should return an error if the server encounters an issue', (done) => {
        chai
            .request(app)
            .delete(`/products/${validProductId}`)
            .auth(token, { type: 'bearer' })
            .set('X-Simulate-Server-Issue', 'true') // Simulate server issue
            .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.have.property('error');
                done();
            });
    });
});
