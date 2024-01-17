// A lancer à l'ouverture de la page
document.addEventListener("DOMContentLoaded", async function () {
  // récupérer les éléments du DOM
  const wordsListDOM = document.querySelector(".wordsList");
  const wordInputDOM = document.querySelector("#newWordInput");
  const addNewWordBtn = document.querySelector("#addNewWordBtn");

  // récupérer la liste des mots sauvegardés
  await chrome.storage.local.get({ pastResearches: [] }, function (storageData) {
    console.log(storageData.pastResearches);
    updatePanelList(storageData.pastResearches);
  });

  // Add click event listener to the "Add" button
  addNewWordBtn.addEventListener("click", function () {
    manuallyAddNewWordToList();
  });

  // Add click event listener to each saved word for deletion
  wordsListDOM.addEventListener("click", function (event) {
    if (event.target.parentNode.className === "delete") {
      console.log("on va supprimer un truc")
      deleteWord(event);
    } else if (event.target.parentNode.className === "saveTranslation") {
      saveTranslation(event); // TODO
    } else if (event.target.parentNode.className === "launchSearch") {
      lookupWord(event.target.dataset.word);
    }
  });

  // Listen for messages from background.js to update the list
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "updateList") {
      chrome.storage.local.get({ pastResearches: [] }, function (storageData) {
        updatePanelList(storageData.pastResearches);
      });
    }
  });

  // function to add new woord to list from input
  async function manuallyAddNewWordToList() {
    const newWord = wordInputDOM.value.trim();
    if (newWord) {
      // // Save the new word to storage
      // await chrome.storage.local.get({ pastResearches: [] }, function (storageData) {
      //   // ajouter le nouveau mot au storage
      //   storageData.pastResearches.push({word:newWord, translation:""});
        
      // });
      
      
      // sauvegarder le mot
      await chrome.storage.local.get({ pastResearches: [] }, async function (storageData) {
        console.log(storageData)
        console.log("storage AVANT ajout manuel d'un mot :", storageData.pastResearches)
        storageData.pastResearches.push({word:newWord, translation:""});
        console.log("storage APRES ajout manuel d'un mot :", storageData.pastResearches)
        await chrome.storage.local.set({ pastResearches: storageData.pastResearches });
        updatePanelList(storageData.pastResearches);
          });



      wordInputDOM.value = ""; // Clear the input field
    }
  }

  // supprimer un mot
  async function deleteWord(event) {
    const wordToDelete = event.target.parentNode.dataset.word;
    await chrome.storage.local.get({ pastResearches: [] }, function (storageData) {
      storageData.pastResearches = storageData.pastResearches.filter(
        (item) => item.word !== wordToDelete
      );
      chrome.storage.local.set(
        { pastResearches: storageData.pastResearches },
        function () {
          console.log("Word deleted:", wordToDelete);
          updatePanelList(storageData.pastResearches);
        }
      );
    });
  }

  //ça marche pas 
  async function saveTranslation(event) {

    const wordBox = event.target.parentNode.parentNode.parentNode;
    const translationInput = wordBox.querySelector(".translationInput");
    console.log(translationInput.value)

    if (translationInput.value) {
      // créer la nvlle div
      var translated = document.createElement('div');
      translated.className = 'translated';
      translated.textContent = translationInput.value;
      // remplacer l'ancienne div par la nouvelle
      wordBox.replaceChild(translated, translationInput.parentNode);

      // sauvegarder la traduction
      await chrome.storage.local.get({ pastResearches: [] }, function (storageData) {
        // identifier le bon espace de storage
        console.log("vérifier storage avant d'updater le storage", storageData.pastResearches);
        let pastResearches = storageData.pastResearches.map(
          (item) => {
            console.log("item auquel on va ajouter une translation :", item);
            if (item.word === wordBox.dataset.word){
              console.log("item.word :", item.word);
              item.translation = translationInput.value
            }
            return item;
          }
          );
          console.log("vérifier storage APRES d'updater le storage", pastResearches);

        chrome.storage.local.set({ pastResearches: pastResearches });
      });



    } else {
      console.error(`List item not found. Event target:`, event.target);
    }
  }

  // Function to look up a word on WordReference
  function lookupWord(word) {
    chrome.runtime.sendMessage({ type: "toBeSearched", searchWord: word });
  }

  // etape 1 : vider le storage

  // etape 2 : updater la liste affichée à l'écran
  async function deleteList() {
    await chrome.storage.local.clear(function () {
      console.log("List cleared");
      updatePanelList([]);
    });
  }

  // permettre à l'utilisateur d'imprimer/de copier la liste dans son presse-papiers/clipboard
  // juste avec le click d'un bouton
  function exportList() {
    chrome.storage.local.get({ pastResearches: [] }, function (storageData) {
      const exportText = storageData.pastResearches.map(obj => `${obj.word}\t${obj.translation}`).join("\n");

      //copier le list avec clipboard
      navigator.clipboard.writeText(exportText).then(function () {
        alert("List exported to clipboard");
      });
    });
  }

  // Add click event listener to the "Supprimer la liste" button
  const deleteListBtn = document.querySelector("#deleteList");
  deleteListBtn.addEventListener("click", deleteList);

  // Add click event listener to the "Exporter la liste" button
  const exportListBtn = document.querySelector("#exportList");
  exportListBtn.addEventListener("click", exportList);

  // Function to update the UI with the list of saved words
  function updatePanelList(pastResearches) {
    wordsListDOM.innerHTML = ""; // Clear the list
    if (pastResearches) {
      pastResearches.forEach(function (item) {
        console.log(item)
        const listItem = document.createElement('div');
        listItem.className = "wordBox"
        listItem.dataset.word = item.word
        listItem.innerHTML = `<span class="word">${item.word}</span>`
        if (!item.translation) {
          listItem.innerHTML +=`
          <div class="translateBox">
          <button class="launchSearch" data-word="${item.word}"><a href="https://www.wordreference.com/enfr/${item.word}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.08333 11.6667H7.74167L7.975 11.4417C7.15833 10.4917 6.66667 9.25833 6.66667 7.91667C6.66667 4.925 9.09167 2.5 12.0833 2.5C15.075 2.5 17.5 4.925 17.5 7.91667C17.5 10.9083 15.075 13.3333 12.0833 13.3333C10.7417 13.3333 9.50833 12.8417 8.55833 12.025L8.33333 12.2583V12.9167L4.16667 17.075L2.925 15.8333L7.08333 11.6667ZM12.0833 11.6667C14.1583 11.6667 15.8333 9.99167 15.8333 7.91667C15.8333 5.84167 14.1583 4.16667 12.0833 4.16667C10.0083 4.16667 8.33333 5.84167 8.33333 7.91667C8.33333 9.99167 10.0083 11.6667 12.0833 11.6667Z" fill="#020202"/></svg></a></button>
          <input type="text" class="translationInput" data-word="${item.word}" placeholder="Entrez la traduction">
          <button class="saveTranslation" data-word="${item.word}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.33335 13.25L3.83335 9.74999L2.66669 10.9167L7.33335 15.5833L17.3334 5.58332L16.1667 4.41666L7.33335 13.25Z" fill="#020202"/></svg></button>
          </div>`
        } else {
        listItem.innerHTML += `<div class="translated">${item.translation}</div>`
        }
        listItem.innerHTML += `<button class="delete" data-word="${item.word}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.8334 5.34166L14.6584 4.16666L10 8.82499L5.34169 4.16666L4.16669 5.34166L8.82502 9.99999L4.16669 14.6583L5.34169 15.8333L10 11.175L14.6584 15.8333L15.8334 14.6583L11.175 9.99999L15.8334 5.34166Z" fill="#FF0000"/></svg></button>`
      
      wordsListDOM.appendChild(listItem);
      });
    }
  }
});

