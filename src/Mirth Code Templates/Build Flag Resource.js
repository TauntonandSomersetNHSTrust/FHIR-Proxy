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

	/**
	 * Add Metadata.
	 * For Sider, there are only a few Alert/Flags from the trust that are agreed to be shared from the org.
	*/

	var SiderPermittedSnomedAlerts = 
	["32000005","115329001"];
	var snomedCodeCheck = "";
	snomedCodeCheck += result.snomed.toString();

	/**
	 * Local Code is set to a random string while there are no legitimate local codes that are valid.
	 * This is a bodge to prevent an empty string matching and displaying an alert in Sider that has not been approved.
	 */

	var SiderPermittedLocalAlerts = 
	["bx79btJLyReMvyGVPxVDfiAeFgWuX7"];
	var localCodeCheck = "";
	localCodeCheck += result.lookupInstanceID.toString();

	if (
		SiderPermittedSnomedAlerts.indexOf(snomedCodeCheck) >= 0
	){
		resource.meta.tag = [
			{
				system:
					'https://fhir.blackpear.com/ui/shared-care-record-visibility',
				code: 'summary',
				display: 'Display in Summary and Detail View'
			}
		];
	}
	else if (
		SiderPermittedLocalAlerts.indexOf(localCodeCheck) >= 0
	){
		resource.meta.tag = [
			{
				system:
					'https://fhir.blackpear.com/ui/shared-care-record-visibility',
				code: 'summary',
				display: 'Display in Summary and Detail View'
			}
		];
	}
	else{
		resource.meta.tag = [
			{
				system:
					'https://fhir.blackpear.com/ui/shared-care-record-visibility',
				code: 'none',
				display: 'Do not Display'
			}
		];
		}

	
	if (
		result.Last_Updated &&
		result.Last_Updated.substring(0, 1) != 'T' &&
		result.Last_Updated.substring(0, 4) != '1900'
	) {
		resource.meta.lastUpdated = result.Last_Updated;
	}
	resource.id = newStringOrUndefined(result.PT_alertID);
	resource.status = newStringOrUndefined(result.status);

	if (result.alertCatID ) {
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

	if (result.snomed ) {
		var snomedCode = {
			system: 'http://snomed.info/sct',
			code: newStringOrUndefined(result.snomed),
			display: newStringOrUndefined(result.alert)
		};
		resource.code.coding.push(snomedCode);
	} else if (result.lookupInstanceID ) {
		var tstCode = {
			system: 'https://fhir.tst.nhs.uk',
			code: newStringOrUndefined(result.lookupInstanceID),
			display: newStringOrUndefined(result.alert)
		};
		resource.code.coding.push(tstCode);
	}

	resource.period = {};

	if (
		result.started  &&
		result.started.substring(0, 1) != 'T' &&
		result.started.substring(0, 4) != '1900'
	) {
		resource.period.start = result.started;
	}

	if (
		result.ended  &&
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