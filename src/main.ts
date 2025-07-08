import './style.css'

(async () => {

  const settings = {
    replaceInvisibleCharacters: true,
    replaceInvisibleCharactersWith: "space",
    replaceMultipleSpaces: true,
  }
  /**
   * A list of invisible characters.
   * Source: https://invisible-characters.com/
   */
  const invisibleCharacters = [" ", "­", "͏", "ᅟ", "ᅠ", "឴", "឵", "᠎", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", "​", "‌", "‍", " ", " ", "⁠", "⁡", "⁢", "⁣", "⁤", "⁪", "⁫", "⁬", "⁭", "⁮", "⁯", "　", "⠀", "ㅤ", "ﾠ", "𝅳", "𝅴", "𝅵", "𝅶", "𝅷", "𝅸", "𝅹", "𝅺"]
  /**
   * The list that contains as a key a character, and as a value its confusables
   */
  const jsonList: { [key: string]: string } = await (await fetch("./list.json")).json();
  // Create the converter to ASCII
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("ascii", { fatal: false });
  /**
   * The input where the user puts the text to check
   */
  const text = document.getElementById("text") as HTMLTextAreaElement;
  /**
   * The paragraph where the result is written
   */
  const result = document.getElementById("result") as HTMLElement;
  /**
   * The checkbox that, if checked, deletes the invisible characters.
   */
  const replaceInvisibleCharacters = document.getElementById("replaceInvisible") as HTMLInputElement;
  /**
   * The select that allows the user to choose if replace invisible characters with a space or
   */
  const replaceInvisibleCharactersSelect = document.getElementById("replaceInvisibleOpt") as HTMLSelectElement;
  /**
   * The checkbox that, if checked, deletes multiple spaces if they're one next to the other.
   */
  const replaceMultipleSpaces = document.getElementById("replaceMultipleSpaces") as HTMLInputElement;


  (document.getElementById("generate") as HTMLButtonElement).addEventListener("click", () => updateResult())
  text.addEventListener("change", () => updateResult());
  /**
   * Update the converted text in the DOM
   */
  function updateResult() {
    result.textContent = generateConvertedString(text.value);

  }
  /**
   * An object that contains as key the characters that cannot be converted to ASCII, and as its value the string to which they will be replaced
   */
  let customStrings: { [key: string]: string } = {};
  /**
   * The array that keeps track the characters that have been added in the "Unreplaceable characters" section
   * @type string[]
   */
  const customStringsAddedToDom: string[] = [];
  /**
   * Convert a normal string to an one with possibly only ASCII characters.
   * @param str the original string
   * @param addToCounter if the number of replaced characters should be updated
   * @returns the output string
   */
  function generateConvertedString(str: string, addToCounter = true) {
    let outputStr = "";
    let numbersOfChanges = 0;
    localStorage.setItem("Unconfusify-Settings", JSON.stringify(settings));
    for (const letter of str) {
      const asciiResult = getAsciiCharacter(letter);
      if (letter === " ") {
        const shouldAddSpace = !settings.replaceMultipleSpaces || !outputStr.endsWith(" ");
        outputStr += shouldAddSpace ? " " : "";
        !shouldAddSpace && numbersOfChanges++;
      } else if (asciiResult === letter) { // It's an ASCII character. Let's keep it
        outputStr += letter;
      } else if (settings.replaceInvisibleCharacters && invisibleCharacters.indexOf(letter) !== -1) { // If the user wants to remove the invisible character, let's do it.
        outputStr += settings.replaceInvisibleCharactersWith === "space" ? (!settings.replaceMultipleSpaces || !outputStr.endsWith(" ")) ? " " : "" : settings.replaceInvisibleCharactersWith === "custom" ? customStrings[letter] ?? letter : "";
        settings.replaceInvisibleCharactersWith === "custom" && !customStringsAddedToDom.includes(letter) && addCustomString(letter, true);
        numbersOfChanges++;
      } else if (typeof jsonList[letter] === "undefined") { // There's no confusable associated with it. Let's add it
        if (typeof customStrings[letter] !== "undefined") { // The user has specified a custom replacement for the character
          outputStr += customStrings[letter];
        } else { // Let's keep this current letter, but ask the user if they want to change it
          !customStringsAddedToDom.includes(letter) && !invisibleCharacters.includes(letter) && addCustomString(letter); // Let's check we haven't added that character jet, and that it's not an invisible character (since the user has disabled the option to replace invisible characters)
          outputStr += letter;
        }
      } else { // Confusable found
        let isAdded = false;
        for (const character of jsonList[letter]) {
          const possibleAsciiReplacement = getAsciiCharacter(character);
          if (getAsciiCharacter(character) === character) { // A confusable with an ASCII character has been found. The original character will be replaced with it
            isAdded = true;
            outputStr += possibleAsciiReplacement;
            numbersOfChanges++;
          }
        }
        if (!isAdded) { // Let's add the current character, even if there's no ASCII confusable.
          outputStr += customStrings[letter] ?? letter;
          if (typeof customStrings[letter] === "undefined" && !customStringsAddedToDom.includes(letter) && !invisibleCharacters.includes(letter)) addCustomString(letter); else numbersOfChanges++;
        }
      }
    }
    if (addToCounter) (document.getElementById("numberReplaced") as HTMLElement).textContent = `${numbersOfChanges}`; // Update the number of replacements 
    return outputStr;
  }

  // Handle settings update

  replaceInvisibleCharacters.addEventListener("change", () => {
    settings.replaceInvisibleCharacters = replaceInvisibleCharacters.checked;
    !replaceInvisibleCharacters.checked && deleteInvisibleCharReplacement()
    updateResult();
  });
  replaceInvisibleCharactersSelect.addEventListener("change", () => {
    settings.replaceInvisibleCharactersWith = replaceInvisibleCharactersSelect.value;
    settings.replaceInvisibleCharactersWith !== "custom" && deleteInvisibleCharReplacement();
      updateResult();
  })
  /**
   * Delete the textboxes in the DOM that permit to choose a custom textbox label. 
   * If the user has added a custom value to them, they'll be kept
   */
  function deleteInvisibleCharReplacement() {
    for (const item of document.querySelectorAll("[data-invisiblechar]")) {
      const charPosition = customStringsAddedToDom.indexOf(item.getAttribute("data-invisiblechar") as string);
      if (typeof customStrings[customStringsAddedToDom[charPosition]] !== "undefined") continue;
      item.nextSibling?.remove();
      item.remove();
      customStringsAddedToDom.splice(charPosition, 1);
    };
  }

  replaceMultipleSpaces.addEventListener("change", () => {
    settings.replaceMultipleSpaces = replaceMultipleSpaces.checked;
    updateResult();
  })

  /**
   * The dialog where the user can know the Unicode code of the character, and also replace it to its original form.
   */
  const unicodeDialog = document.getElementById("unicodeSymbolDialog") as HTMLDivElement;

  /**
   * Add to the DOM an input where the user can choose what to do with a character that isn't easily replaceable
   * @param char the character that could be replaced if the user wants so
   * @param display the content that should be displayed at the left of the input
   */
  function addCustomString(char: string, isInvisible = invisibleCharacters.indexOf(char) !== -1) {
    const container = document.createElement("label");
    container.classList.add("flex", "hcenter", "gap");
    const label = Object.assign(document.createElement("label"), {
      textContent: `${isInvisible ? "[Invisible] " : ""}${char}`,
      style: "text-decoration: underline",
      onclick: () => { // Show the dialog where the user can know more about that Unicode symbol
        unicodeDialog.style.display = "block";
        setTimeout(() => {unicodeDialog.style.opacity = "1"}, 20);
        const unicodeCode = char.codePointAt(0)?.toString(16).toUpperCase();
        (document.getElementById("viewUnicodeDetails") as HTMLAnchorElement).textContent = unicodeCode ?? ""; 
        (document.getElementById("viewUnicodeDetails") as HTMLAnchorElement).href = `https://unicode-explorer.com/c/${unicodeCode}`;
        (document.getElementById("restoreReplacement") as HTMLButtonElement).onclick = () => { // Restore the default replacement for that Unicode character
          input.value = char;
          input.dispatchEvent(new Event("change"));
        }
      }
    })
    const input = Object.assign(document.createElement("input"), { // The input where the user will be able to choose a custom replacement
      type: "text",
      onchange: () => {
        customStrings[char] = input.value;
        if (customStrings[char] === char) delete customStrings[char]; // Avoid saving useless values in the object
        result.textContent = generateConvertedString(text.value);
        localStorage.setItem("Unconfusify-CustomStrings", JSON.stringify(customStrings));
      },
      value: customStrings[char] ?? char
    });
    customStringsAddedToDom.push(char);
    container.append(label, input);
    isInvisible && container.setAttribute("data-invisiblechar", char);
    document.getElementById("unreplaceableCharacters")?.append(container, document.createElement("br"));
  }

  /**
   * Convert a character to its ASCII equivalent
   * @param char the character to convert
   * @returns the converted character
   */
  function getAsciiCharacter(char: string) {
    return decoder.decode(encoder.encode(char));
  }

  // Get the previous custom characters replacement and apply them
  const restoreCustomStrings = JSON.parse(localStorage.getItem("Unconfusify-CustomStrings") ?? "{}");
  for (const key in restoreCustomStrings) {
    if (restoreCustomStrings[key] !== "") {
      customStrings[key] = restoreCustomStrings[key];
      addCustomString(key, invisibleCharacters.indexOf(key) !== -1);
    }
  }

  // Set up the dialog where the user can download the generated text

  const downloadLink = document.getElementById("downloadLink") as HTMLAnchorElement;
  const downloadDialog = document.getElementById("downloadDialog") as HTMLDivElement;
  const fileNameInput = document.getElementById("fileName") as HTMLInputElement;

  document.getElementById("download")?.addEventListener("click", () => { // Show the dialog to download the converted text
    for (const item of document.querySelectorAll("[data-adaptheight]")) (item as HTMLElement).style.height = `${document.querySelector("button")?.getBoundingClientRect().height}px`;
    downloadDialog.style.display = "block";
    setTimeout(() => { downloadDialog.style.opacity = "1" }, 50);
    downloadLink.href = URL.createObjectURL(new Blob([result.textContent ?? ""], { type: "text/plain" })); // While we don't know the name (so, we'll add it a generic name in the next line), we can create the Blob for the current text
    downloadLink.download = `Unconfusify-${Date.now()}.txt`;
    fileNameInput.value = downloadLink.download;
  });

  fileNameInput.addEventListener("input", () => { // Change the name of the output file
    downloadLink.download = fileNameInput.value;
  })

  for (const item of document.querySelectorAll("[data-closedialog]")) item.addEventListener("click", () => { // Set up the button that permits to close the dialog. It works for all dialogs.
    const dialog = item.closest(".dialog");
    if (dialog instanceof HTMLElement) {
      dialog.style.opacity = "0";
      setTimeout(() => { dialog.style.display = "none" }, 220);
    }
  })
  document.getElementById("copy")?.addEventListener("click", () => { // Copy the converted text in the clipboard
    navigator.clipboard.writeText(result.textContent ?? "");
  })

  document.getElementById("fileReader")?.addEventListener("click", () => { // Copy the text of a file in the textbox
    const input = Object.assign(document.createElement("input"), {
      type: "file",
      onchange: async () => {
        if (input.files) {
          text.value = await input.files[0].text();
          result.textContent = generateConvertedString(text.value);
        }
      }
    });
    input.click();
  });

  // Switch between light and dark theme
  let isLightTheme = localStorage.getItem("Unconfusify-Theme") === "light";
  function toggleTheme(saveInSettings = true) {
    if (saveInSettings) {
      isLightTheme = !isLightTheme;
      localStorage.setItem("Unconfusify-Theme", isLightTheme ? "light" : "dark");
    }
    document.body.style = isLightTheme ? "--background: var(--background-light); --text: var(--text-light); --card: var(--card-light); --input: var(--input-light)" : "";
    console.log(isLightTheme, document.body.style);
    for (const item of document.querySelectorAll("[data-icon]")) {
      item.setAttribute(item.getAttribute("data-icon") as string, isLightTheme ? "./logo_light.svg" : "./logo.svg");
    }
  };
  document.getElementById("changeTheme")?.addEventListener("click", () => toggleTheme());
  isLightTheme && toggleTheme(false);

  // Restore settigns;
  const prevSettings = JSON.parse(localStorage.getItem("Unconfusify-Settings") ?? "{}");
  for (const key in prevSettings) {
    // @ts-ignore
    settings[key] = prevSettings[key];
  }

  // Update the DOM with the restored preferences 
  
  replaceInvisibleCharacters.checked = settings.replaceInvisibleCharacters;
  replaceInvisibleCharactersSelect.value = settings.replaceInvisibleCharactersWith;
  replaceMultipleSpaces.checked = settings.replaceMultipleSpaces;
})()