import {
	ApiSource,
	OFFICIAL_API_URL,
	SettingKey,
	UiOptions,
	defaultSettings,
	loadSetting,
	saveSetting,
} from './services/storage.ts'

const inputSelectors = {
	apiUrl: '#api-url',
	apiKey: '#api-key',
	webUiUrl: '#web-ui-url',
	searchQuery: '#search-query',
	showLabelsButton: '#show-labels-button',
	showArchiveButton: '#show-archive-button',
	showDeleteButton: '#show-delete-button',
}

const apiSourceRadios = 'input[name="api-source"]'
const apiUrlLabelSelector = '#api-url-label'
const apiUrlHintSelector = '#api-url-hint'
const saveButtonSelector = '#save-button'
const testResultSelector = '#test-result'

const filterGroups = ['in-filter', 'is-filter', 'type-filter', 'sort-filter']
const otherFilterGroup = 'other-filter'

async function initialize() {
	const apiSource = (await loadSetting('apiSource')) as ApiSource
	setApiSource(apiSource)
	await restoreInput('apiUrl', inputSelectors.apiUrl)
	await restoreInput('webUiUrl', inputSelectors.webUiUrl)
	updateApiKeyLink()
	const apiKey = await restoreInput('apiKey', inputSelectors.apiKey)
	validateInput(apiKey, inputSelectors.apiKey)
	await restoreInput('searchQuery', inputSelectors.searchQuery)
	// Migrate old default or empty value to new default
	const currentQuery = getInput(inputSelectors.searchQuery).value.trim()
	if (!currentQuery || currentQuery === 'in:inbox') {
		getInput(inputSelectors.searchQuery).value = defaultSettings.searchQuery
	}
	restoreFilterCheckboxesFromQuery()
	await restoreOptionsCheckbox(
		inputSelectors.showLabelsButton,
		'showLabelsButton',
	)
	await restoreOptionsCheckbox(
		inputSelectors.showArchiveButton,
		'showArchiveButton',
	)
	await restoreOptionsCheckbox(
		inputSelectors.showDeleteButton,
		'showDeleteButton',
	)
	revalidateApiSource()
}

function getInput(selector: string) {
	return document.querySelector<HTMLInputElement>(selector)!
}

function getApiSourceRadios() {
	return Array.from(
		document.querySelectorAll<HTMLInputElement>(apiSourceRadios),
	)
}

function getSelectedApiSource(): ApiSource {
	const checked = getApiSourceRadios().find((radio) => radio.checked)
	return (checked?.value as ApiSource) || 'official'
}

function setApiSource(apiSource: ApiSource) {
	for (const radio of getApiSourceRadios()) {
		radio.checked = radio.value === apiSource
	}
	syncApiUrlVisibility()
}

function syncApiUrlVisibility() {
	const apiSource = getSelectedApiSource()
	const apiUrlLabel = document.querySelector<HTMLLabelElement>(
		apiUrlLabelSelector,
	)!
	const apiUrlInput = getInput(inputSelectors.apiUrl)
	const isCustom = apiSource === 'custom'
	apiUrlLabel.hidden = !isCustom
	apiUrlInput.disabled = !isCustom
}

function revalidateApiSource() {
	const apiSource = getSelectedApiSource()
	const apiUrl = getInput(inputSelectors.apiUrl).value.trim()
	const saveButton =
		document.querySelector<HTMLButtonElement>(saveButtonSelector)!
	const hint = document.querySelector<HTMLElement>(apiUrlHintSelector)!
	const missingCustomUrl = apiSource === 'custom' && !apiUrl
	saveButton.disabled = missingCustomUrl
	hint.hidden = !missingCustomUrl
}

async function restoreInput(settingKey: SettingKey, inputSelector: string) {
	const settingValue = await loadSetting(settingKey)
	const input = getInput(inputSelector)
	input.value = settingValue as string
	return settingValue as string
}

async function restoreOptionsCheckbox(
	inputSelector: string,
	uiOptionsKey: keyof UiOptions,
) {
	const settingValue = (await loadSetting('uiOptions'))[uiOptionsKey]
	const input = getInput(inputSelector)
	input.checked = settingValue
	return settingValue
}

function validateInput(settingValue: string, inputSelector: string) {
	const isValid = !!settingValue
	const input = getInput(inputSelector)
	input.className = isValid ? 'valid' : ''
}

function updateApiKeyLink() {
	const webUiUrl = getInput(inputSelectors.webUiUrl).value.trim()
	const link = document.querySelector<HTMLAnchorElement>('#api-key-link')!
	const baseUrl = webUiUrl || defaultSettings.webUiUrl
	link.href = `${baseUrl.replace(/\/$/, '')}/settings/api`
}

function getCheckedFilters(groupName: string): string[] {
	return Array.from(
		document.querySelectorAll<HTMLInputElement>(
			`input[name="${groupName}"]:checked`,
		),
	).map((cb) => cb.value)
}

function getAllCheckedFilters(): string[] {
	const filters: string[] = []
	for (const group of filterGroups) {
		const checked = getCheckedFilters(group)
		filters.push(...checked)
	}
	const otherChecked = getCheckedFilters(otherFilterGroup)
	filters.push(...otherChecked)
	return filters
}

function buildSearchQuery(): string {
	return getAllCheckedFilters().join(' ')
}

function restoreFilterCheckboxesFromQuery() {
	const query = getInput(inputSelectors.searchQuery).value.trim()
	if (!query) {
		// Set defaults
		setDefaultFilters()
		updateSearchQueryInput()
		return
	}
	const parts = query.split(/\s+/)
	// Uncheck all first
	for (const group of [...filterGroups, otherFilterGroup]) {
		document
			.querySelectorAll<HTMLInputElement>(`input[name="${group}"]`)
			.forEach((cb) => (cb.checked = false))
	}
	// Check matching ones
	for (const part of parts) {
		for (const group of [...filterGroups, otherFilterGroup]) {
			const checkbox = document.querySelector<HTMLInputElement>(
				`input[name="${group}"][value="${part}"]`,
			)
			if (checkbox) {
				checkbox.checked = true
			}
		}
	}
	// If nothing matched, set defaults
	const hasChecked = getAllCheckedFilters().length > 0
	if (!hasChecked) {
		setDefaultFilters()
	}
	updateSearchQueryInput()
}

function setDefaultFilters() {
	for (const group of [...filterGroups, otherFilterGroup]) {
		document
			.querySelectorAll<HTMLInputElement>(`input[name="${group}"]`)
			.forEach((cb) => (cb.checked = false))
	}
	const defaultIn = document.querySelector<HTMLInputElement>(
		'input[name="in-filter"][value="in:inbox"]',
	)
	const defaultIs = document.querySelector<HTMLInputElement>(
		'input[name="is-filter"][value="is:unread"]',
	)
	const defaultSort = document.querySelector<HTMLInputElement>(
		'input[name="sort-filter"][value="sort:saved"]',
	)
	if (defaultIn) defaultIn.checked = true
	if (defaultIs) defaultIs.checked = true
	if (defaultSort) defaultSort.checked = true
}

function updateSearchQueryInput() {
	const query = buildSearchQuery()
	getInput(inputSelectors.searchQuery).value = query
}

function showTestResult(message: string, isSuccess: boolean) {
	const resultEl = document.querySelector<HTMLElement>(testResultSelector)!
	resultEl.textContent = message
	resultEl.hidden = false
	resultEl.className = `test-result ${isSuccess ? 'success' : 'error'}`
}

function hideTestResult() {
	const resultEl = document.querySelector<HTMLElement>(testResultSelector)!
	resultEl.hidden = true
}

async function testApiUrl() {
	const apiUrl = getInput(inputSelectors.apiUrl).value.trim()
	if (!apiUrl) {
		showTestResult('Please enter an API URL first.', false)
		return
	}

	if (!apiUrl.endsWith('/api/graphql')) {
		showTestResult(
			'Warning: URL should end with /api/graphql. Please check your configuration.',
			false,
		)
		return
	}

	hideTestResult()
	const testButton = document.querySelector<HTMLButtonElement>('#test-api-url')!
	testButton.disabled = true
	testButton.textContent = 'Testing...'

	try {
		const apiKey = await loadSetting('apiKey')
		const response = await fetch(apiUrl, {
			body: JSON.stringify({ query: 'query{__typename}' }),
			headers: {
				...(apiKey ? { Authorization: apiKey } : {}),
				'Content-Type': 'application/json',
			},
			method: 'POST',
		})
		if (response.ok) {
			const data = await response.json()
			if (data.data && data.data.__typename === 'Query') {
				showTestResult('Connection successful! API is reachable.', true)
			} else if (data.errors) {
				showTestResult(
					`API responded with errors: ${data.errors[0]?.message || 'Unknown error'}`,
					false,
				)
			} else {
				showTestResult(
					'API responded but result is unexpected. Please verify the URL.',
					false,
				)
			}
		} else {
			showTestResult(
				`HTTP error: ${response.status} ${response.statusText}`,
				false,
			)
		}
	} catch (error) {
		showTestResult(
			`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			false,
		)
	} finally {
		testButton.disabled = false
		testButton.textContent = 'Test'
	}
}

async function saveOptions(event: SubmitEvent) {
	event.preventDefault()
	const apiSource = getSelectedApiSource()
	const apiUrlInput = getInput(inputSelectors.apiUrl)
	const apiUrl = apiUrlInput.value.trim()
	if (apiSource === 'custom' && !apiUrl) {
		revalidateApiSource()
		return
	}
	await saveSetting('apiSource', apiSource)
	await saveSetting(
		'apiUrl',
		apiSource === 'custom' ? apiUrl : OFFICIAL_API_URL,
	)
	const webUiUrl = getInput(inputSelectors.webUiUrl).value.trim()
	await saveSetting('webUiUrl', webUiUrl || defaultSettings.webUiUrl)
	const apiKey = getInput(inputSelectors.apiKey).value
	await saveSetting('apiKey', apiKey)
	validateInput(apiKey, inputSelectors.apiKey)
	const searchQuery = getInput(inputSelectors.searchQuery).value
	await saveSetting('searchQuery', searchQuery)

	const showLabelsButton = getInput(inputSelectors.showLabelsButton).checked
	const showArchiveButton = getInput(inputSelectors.showArchiveButton).checked
	const showDeleteButton = getInput(inputSelectors.showDeleteButton).checked
	await saveSetting('uiOptions', {
		showLabelsButton,
		showArchiveButton,
		showDeleteButton,
	})

	const messageElement = document.querySelector('#message')!
	messageElement.classList.add('success')
	messageElement.textContent = 'Saved!'
	setTimeout(() => {
		messageElement.textContent = ''
		messageElement.classList.remove('success')
	}, 2_000)
}

document.addEventListener('DOMContentLoaded', initialize)
document
	.querySelector<HTMLFormElement>('form')!
	.addEventListener('submit', saveOptions)

document.addEventListener('change', (event) => {
	const element = event.target as HTMLElement
	if (element instanceof HTMLInputElement && element.name === 'api-source') {
		syncApiUrlVisibility()
		revalidateApiSource()
	}
})

document.addEventListener('input', (event) => {
	const element = event.target as HTMLElement
	if (element instanceof HTMLInputElement && element.id === 'api-url') {
		revalidateApiSource()
		hideTestResult()
	}
	if (element instanceof HTMLInputElement && element.id === 'web-ui-url') {
		updateApiKeyLink()
	}
})

document.addEventListener('change', (event) => {
	const element = event.target as HTMLElement
	if (element instanceof HTMLInputElement) {
		// Handle mutually exclusive filter groups
		if (filterGroups.includes(element.name)) {
			// Uncheck all other checkboxes in the same group
			document
				.querySelectorAll<HTMLInputElement>(
					`input[name="${element.name}"]`,
				)
				.forEach((cb) => {
					if (cb !== element) {
						cb.checked = false
					}
				})
		}
		// Update search query for any filter change
		if (
			filterGroups.includes(element.name) ||
			element.name === otherFilterGroup
		) {
			updateSearchQueryInput()
		}
	}
})

document.addEventListener('click', async (event) => {
	const element = event.target as HTMLElement
	if (element.tagName !== 'BUTTON') {
		return
	}
	if (element.classList.contains('restore-defaults')) {
		const searchQueryInput = getInput(inputSelectors.searchQuery)
		searchQueryInput.value = defaultSettings.searchQuery
		const apiUrlInput = getInput(inputSelectors.apiUrl)
		apiUrlInput.value = defaultSettings.apiUrl
		const webUiUrlInput = getInput(inputSelectors.webUiUrl)
		webUiUrlInput.value = defaultSettings.webUiUrl
		updateApiKeyLink()
		setApiSource(defaultSettings.apiSource)
		restoreFilterCheckboxesFromQuery()
		revalidateApiSource()
		hideTestResult()
	}
	if (element.id === 'test-api-url') {
		await testApiUrl()
	}
})
