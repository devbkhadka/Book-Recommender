import { TestBed, inject } from '@angular/core/testing';

import { ApicallerService } from './apicaller.service';

describe('ApicallerService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ApicallerService]
		});
	});

	it('should be created', inject([ApicallerService], (service: ApicallerService) => {
		expect(service).toBeTruthy();
	}));
});
