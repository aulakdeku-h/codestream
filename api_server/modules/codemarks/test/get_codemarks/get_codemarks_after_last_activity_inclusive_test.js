'use strict';

const GetCodemarksByLastActivityTest = require('./get_codemarks_by_last_activity_test');

class GetCodemarksAfterLastActivityInclusiveTest extends GetCodemarksByLastActivityTest {

	get description () {
		return 'should return the correct codemarks in correct order when requesting codemarks for a team and after last activity, inclusive';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			// pick a pivot point, then filter our expected codemarks based on that pivot,
			// and specify the before parameter to fetch based on the pivot
			const pivot = this.expectedCodemarks[5].lastActivityAt;
			this.expectedCodemarks = this.expectedCodemarks.filter(codemark => codemark.lastActivityAt >= pivot);
			this.path = `/codemarks?teamId=${this.team.id}&byLastActivityAt=1&after=${pivot}&inclusive`;
			callback();
		});
	}
}

module.exports = GetCodemarksAfterLastActivityInclusiveTest;
