'use strict';

const assert = require('node:assert');

const { addResource } = require('../../../lib/utils/resources');

describe('Utils', () => {
	describe('Resources', () => {
		describe('addResource()', () => {

			const existingResourceName = 'existingResource';
			const existingResourceDefinition = { type: 'aws::service::oldresource' };

			const newResourceName = 'newResource';
			const newResourceDefinition = { type: 'aws::service::resource' };

			context('When resources is empty', () => {

				it('Should create it as object and add the new resource', () => {

					const result = addResource({}, newResourceName, newResourceDefinition);

					assert.deepStrictEqual(result, {
						Resources: {
							[newResourceName]: newResourceDefinition
						}
					});
				});

			});

			context('When resources is an object', () => {

				it('Should add the new resource if it does not exist', () => {

					const result = addResource({
						Resources: {
							[existingResourceName]: existingResourceDefinition
						}
					}, newResourceName, newResourceDefinition);

					assert.deepStrictEqual(result, {
						Resources: {
							[existingResourceName]: existingResourceDefinition,
							[newResourceName]: newResourceDefinition
						}
					});
				});

				it('Should override the current resource if it already exists', () => {

					const result = addResource({
						Resources: {
							[newResourceName]: existingResourceDefinition
						}
					}, newResourceName, newResourceDefinition);

					assert.deepStrictEqual(result, {
						Resources: {
							[newResourceName]: newResourceDefinition
						}
					});
				});

			});

			context('When resources is an array', () => {

				it('Should add the new resource if it does not exist', () => {

					const result = addResource({
						Resources: [
							{
								[existingResourceName]: existingResourceDefinition
							}
						]
					}, newResourceName, newResourceDefinition);

					assert.deepStrictEqual(result, {
						Resources: [
							{
								[existingResourceName]: existingResourceDefinition
							},
							{
								[newResourceName]: newResourceDefinition
							}
						]
					});
				});

				it('Should override the current resource if it already exists', () => {

					const result = addResource({
						Resources: [
							{
								[newResourceName]: existingResourceDefinition
							}
						]
					}, newResourceName, newResourceDefinition);

					assert.deepStrictEqual(result, {
						Resources: [
							{
								[newResourceName]: newResourceDefinition
							}
						]
					});
				});

			});

			context('External config honoring', () => {

				it('Should not override any properties besides Resources', () => {

					const result = addResource({
						Resources: {
							[existingResourceName]: existingResourceDefinition
						},
						Extensions: { foo: 'bar' },
						Outputs: { foo: 'bar' }
					}, newResourceName, newResourceDefinition);

					assert.deepStrictEqual(result, {
						Resources: {
							[existingResourceName]: existingResourceDefinition,
							[newResourceName]: newResourceDefinition
						},
						Extensions: { foo: 'bar' },
						Outputs: { foo: 'bar' }
					});
				});

			});

		});
	});
});
