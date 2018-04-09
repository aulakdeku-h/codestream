'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class DeleteFromCacheTest extends DataCollectionTest {

	get description () {
		return 'should not get a model after it has been deleted from the cache';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,					// set up mongo client
			this.createTestAndControlModel,	// create a test model and a control model that we won't touch
			this.deleteModel				// delete the test model
		], callback);
	}

	async deleteModel (callback) {
		try {
			await this.data.test.deleteById(this.testModel.id);
		}
		catch (error) {
			callback(error);
		}
		callback();
	}

	// run the test...
	async run (callback) {
		// we'll fetch the test model and control model, but since the test model has been deleted,
		// we should only get the control model
		this.testModels = [this.controlModel];
		let response;
		try {
			response = await this.data.test.getByIds(
				[this.testModel.id, this.controlModel.id]
			);
		}
		catch (error) {
			return callback(error);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		// validate that we get only the control model
		this.validateArrayResponse();
	}
}

module.exports = DeleteFromCacheTest;
