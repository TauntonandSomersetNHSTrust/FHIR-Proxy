/**
	Builds Patient FHIR resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Patient-1 for more info.
	
	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Patient FHIR resource.
	
 */
function buildPatientResource(data) {
	const result = getResultSet(data);

	if (
		result.NHS_Verified === undefined ||
		result.NHS_Verified === null ||
		result.NHS_Verified == '0'
	) {
		result.NHS_Verified = '2';
		result.nhsNumberTraceStatusDesc = 'Number present but not traced';
	}

	if (result.dod === undefined || result.dod === null) {
		result.dod = false;
	} else {
		result.dod = true;
	}
 	if (result.Sex == '1') {
		result.Sex = 'male';
	} else if (result.Sex == '2') {
		result.Sex = 'female';
	} else {
		result.Sex = 'other';
	} 

	/**
	 * Hard-coding meta profile and resourceType into resource as this should not
	 * be changed for this resource, ever.
	 */
	const resource = {
		fullUrl: $cfg('apiUrl') + $('contextPath') + '/' + result.MRN,
		meta: {
			profile: [
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Patient-1'
			]
		},
		resourceType: newStringOrUndefined('Patient'),
		identifier: [
			{
				use: newStringOrUndefined('usual'),
				system: newStringOrUndefined(
					'https://fhir.tst.nhs.uk/Id/local-patient-identifier'
				),
				value: newStringOrUndefined(result.MRN)
			}
		],
		name: [
			{
				use: newStringOrUndefined('usual'),
				family: newStringOrUndefined(result.PT_Surname),
				given: newStringOrUndefined(result.PT_Forename),
				prefix: newStringOrUndefined(result.Title)
			}
		],
		gender: newStringOrUndefined(result.Sex),
		birthDate: newStringOrUndefined(result.dob),
		deceasedBoolean: newBooleanOrUndefined(result.dod),
		address: [
			{
				use: newStringOrUndefined('home'),
				type: newStringOrUndefined('postal'),
				line: [
					newStringOrUndefined(result.addressline1),
					newStringOrUndefined(result.addressline2),
					newStringOrUndefined(result.addressline3)
				],
				city: newStringOrUndefined(result.addressline4),
				district: newStringOrUndefined(result.addressline5),
				postalCode: newStringOrUndefined(result.postcode)
			}
		],
		id: newStringOrUndefined(result.MRN),
		language: newStringOrUndefined('English (Great Britain)')
	};

	// Add meta data
	if (
		result.Last_Updated &&
		result.Last_Updated.substring(0, 1) != 'T' &&
		result.Last_Updated.substring(0, 1) != '1900'
	) {
		resource.meta.lastUpdated = newStringOrUndefined(result.Last_Updated);
	}

	// Add NHS No
	if (result.NHS ) {
		const nhsIdentifier = {
			use: newStringOrUndefined('official'),
			system: newStringOrUndefined('https://fhir.nhs.uk/Id/nhs-number'),
			value: newStringOrUndefined(result.NHS),
			extension: [
				{
					url: newStringOrUndefined(
						'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-NHSNumberVerificationStatus-1'
					),
					valueCodeableConcept: {
						coding: [
							{
								system: newStringOrUndefined(
									'https://fhir.hl7.org.uk/STU3/CodeSystem/CareConnect-NHSNumberVerificationStatus-1'
								),
								code: newStringOrUndefined(
									result.NHS_Verified
								),
								display: newStringOrUndefined(
									result.nhsNumberTraceStatusDesc
								)
							}
						]
					}
				}
			]
		};
		resource.identifier.push(nhsIdentifier);
	}

	resource.contact = [];

	// Add Next of kin contact details
	//Presented in a nested array like:
	/// system,code,display,contactName,contactSurname,contactPhone|system,code,display,contactName,contactSurname,contactPhone|system,code,display,contactName,contactSurname,contactPhone
	if (result.FHIRNOKs){
		const emptyContact = {
			relationship: {
				coding: [{
					system: undefined,
					code: undefined,
					display: undefined
				}]
			},
			name: {
				use: 'usual',
				text: undefined,
				family: undefined,
				given: undefined
			},
			telecom:
				{
				system: undefined,
				value: undefined
				}
		};
		
		const NOKSplit = result.FHIRNOKs.split('\\|');
		
		for (var i=0; i < NOKSplit.length; i++){
			
			var NOKEntry = JSON.parse(JSON.stringify(emptyContact));
			
			var NOKArray = NOKSplit[i].toString();
			
			var components = NOKArray.split('\\,');
			
			NOKEntry.relationship.coding[0].system = newStringOrUndefined(
				components[0]
			);
			NOKEntry.relationship.coding[0].code = newStringOrUndefined(
				components[1]
			);
			NOKEntry.relationship.coding[0].display = newStringOrUndefined(
				components[2]
			);
			NOKEntry.name.text = newStringOrUndefined(
				components[3] + ' '+components[4]
			);
			NOKEntry.name.family = newStringOrUndefined(
				components[4]
			);
			NOKEntry.name.given = newStringOrUndefined(
				components[3]
			);
			NOKEntry.telecom.system = 'phone';
			NOKEntry.telecom.value = newStringOrUndefined(
				components[5]
			);
			resource.contact.push(NOKEntry);
		}
	}

	// Add MPH Switchboard contact details
	const switchboardContact = {
		name: {
			use: 'anonymous',
			text: 'Musgrove Park Hospital Switchboard (24 Hours)'
		},
		telecom: [
			{
				system: 'phone',
				value: '01823333444'
			}
		],
		organization: {
			reference:
				'https://directory.spineservices.nhs.uk/STU3/Organization/RBA',
			display: 'TAUNTON AND SOMERSET NHS FOUNDATION TRUST'
		}
	};

	resource.contact.push(switchboardContact);

	// Add Telecom contact details
	const telecom = [];
	if (result.Home_Number) {
		const homePhone = {
			system: newStringOrUndefined('phone'),
			value: newStringOrUndefined(result.Home_Number),
			use: newStringOrUndefined('home')
		};
		telecom.push(homePhone);
	}
	if (result.Work_Number) {
		const mobilePhone = {
			system: newStringOrUndefined('phone'),
			value: newStringOrUndefined(result.Work_Number),
			use: newStringOrUndefined('mobile')
		};
		telecom.push(mobilePhone);
	}
	if (telecom.length > 0) {
		resource.telecom = telecom;
	}

	// Extensions (Care Connect or otherwise)
	const extension = [];
	// Add Ethnic Category extension
	if (result.ethnicCode) {
		const ethCatExtension = {
			url: newStringOrUndefined(
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-EthnicCategory-1'
			),
			valueCodeableConcept: {
				coding: [
					{
						system: newStringOrUndefined(
							'https://fhir.hl7.org.uk/STU3/CodeSystem/CareConnect-EthnicCategory-1'
						),
						code: newStringOrUndefined(
							result.ethnicCode
						),
						display: newStringOrUndefined(
							result.ethnicText
						)
					}
				]
			}
		};
		extension.push(ethCatExtension);
	}

	if (extension.length > 0) {
		resource.extension = extension;
	}

	// Add Marital Status
	if (
		result.maritalStatusCode &&
		result.maritalStatusDesc
	) {
		resource.maritalStatus = {
			coding: [
				{
					system: newStringOrUndefined(
						'https://hl7.org/fhir/stu3/v3/MaritalStatus'
					),
					code: newStringOrUndefined(result.maritalStatusCode),
					display: newStringOrUndefined(result.maritalStatusDesc)
				}
			]
		};
	}

	// If patient has a 'Do Not Distribute Patient Address' alert, strip out contact details
	if (result.DND) {
		delete resource.telecom;
		delete resource.address;
		resource.meta.security = [
			{
				system: 'https://hl7.org/fhir/ValueSet/v3-Confidentiality',
				code: 'R',
				display: 'restricted'
			}
		];
	}

	return resource;
}
