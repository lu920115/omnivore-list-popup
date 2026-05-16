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
	searchQuery: '#search-query',
	showLabelsButton: '#show-labels-button',
	showArchiveButton: '#show-archive-button',
	showDeleteButton: '#show-delete-button',
}

const apiSourceRadios = 'input[name="api-source"]'
const apiUrlLabelSelector = '#api-url-label'
const apiUrlHintSelector = '#api-url-hint'
const saveButtonSelector = '#save-button'

async function initialize() {
	const apiSource = (await loadSetting('apiSource')) as ApiSource
	setApiSource(apiSource)
	await restoreInput('apiUrl', inputSelectors.apiUrl)
	const apiKey = await restoreInput('apiKey', inputSelectors.apiKey)
	validateInput(apiKey, inputSelectors.apiKey)
	await restoreInput('searchQuery', inputSelectors.searchQuery)
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
	input.value = settingValue
	return settingValue
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
		setApiSource(defaultSettings.apiSource)
		revalidateApiSource()
	}
})
