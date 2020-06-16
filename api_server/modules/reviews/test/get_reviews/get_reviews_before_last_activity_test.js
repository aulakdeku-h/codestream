'use strict';

const GetReviewsByLastActivityTest = require('./get_reviews_by_last_activity_test');

class GetReviewsBeforeLastActivityTest extends GetReviewsByLastActivityTest {

	get description () {
		return 'should return the correct reviews in correct order when requesting reviews for a team and before last activity';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			// pick a pivot point, then filter our expected reviews based on that pivot,
			// and specify the before parameter to fetch based on the pivot
			const pivot = this.expectedReviews[5].lastActivityAt;
			this.expectedReviews = this.expectedReviews.filter(review => review.lastActivityAt < pivot);
			this.path = `/reviews?teamId=${this.team.id}&byLastActivityAt=1&before=${pivot}`;
			callback();
		});
	}
}

module.exports = GetReviewsBeforeLastActivityTest;
