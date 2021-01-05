/**
	Builds Flag FHIR Resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Flag-1 for more info.

	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Flag FHIR resource.
 */
 
function buildFlagResource(data) {
	var result = getResultSet(data);
	/**
	 * Hard-coding meta profile and resourceType into resource as this should not
	 * be changed for this resource, ever.
	 */

	var resource = {
		meta: {
			profile: [
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Flag-1'
			]
		},
		resourceType: 'Flag'
	};
	// Add meta data
	if (getResultSetString(data, 'Last_Updated') != undefined &&
		getResultSetString(data, 'Last_Updated').substring(0, 1) != 'T' &&
		getResultSetString(data, 'Last_Updated').substring(0, 4) != '1900') {
		resource['meta']['Last_Updated'] = getResultSetString(data, 'Last_Updated');
	}
	resource.id = newStringOrUndefined(result.PT_alertID);
	resource.status = newStringOrUndefined(result.status);

	if (result.alertCatID != undefined) {
		resource.category = {
			coding: [{
				system: 'https://fhir.tst.nhs.uk',
				code: newStringOrUndefined(result.alertCatID),
				display: newStringOrUndefined(
					result.alertCat
				)
			}]
		};
	}

	resource.code = {
		coding: []
	};

	if (result.snomed != undefined) {
		var snomedCode = {
			system: 'http://snomed.info/sct',
			code: newStringOrUndefined(result.snomed),
			display: newStringOrUndefined(result.alert)
		};
		resource.code.coding.push(snomedCode);
	} else if (result.localID != undefined) {
		var tstCode = {
			system: 'https://fhir.tst.nhs.uk',
			code: newStringOrUndefined(result.localID),
			display: newStringOrUndefined(result.alert)
		};
		resource.code.coding.push(tstCode);
	}

	resource.period = {};

	if (
		result.started != undefined &&
		result.started.substring(0, 1) != 'T' &&
		result.started.substring(0, 4) != '1900'
	) {
		resource.period.start = result.started;
	}

	if (
		result.ended != undefined &&
		result.ended.substring(0, 1) != 'T' &&
		result.ended.substring(0, 4) != '1900'
	) {
		resource.period.end = result.ended;
	}

	resource.subject = {
		reference: ''
			.concat($cfg('apiUrl'), '/Patient/')
			.concat(result.MRN)
	};
	return resource;
}