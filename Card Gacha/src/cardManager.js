document.addEventListener('DOMContentLoaded', () => {
    const rarities = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "celestial"];
    const rarityData = {
        common:     { weight: 40, stars: 1, color: 'gray' },
        uncommon:   { weight: 25, stars: 2, color: 'green' },
        rare:       { weight: 15, stars: 3, color: 'blue' },
        epic:       { weight: 10, stars: 4, color: 'purple' },
        legendary:  { weight: 6,  stars: 5, color: 'gold' },
        mythic:     { weight: 3,  stars: 6, color: 'red' },
        celestial:  { weight: 1,  stars: 7, color: 'celestial' },
    };

    const pullButton = document.getElementById('pull-button');
    const cardContainer = document.getElementById('main-card-container');

    function getRarityData(rarity){
        if (!rarity in rarityData){return [null]}
        const relevantData = rarityData[rarity];
        return [relevantData.weight, relevantData.stars, relevantData.color];
    }

    function isCardLegendaryOrMore(rarity){
        return ['legendary', 'mythic', 'celestial'].includes(rarity)
    }

    function getRandomRarity() {
        const total = Object.values(rarityData).reduce((sum, { weight }) => sum + weight, 0);
        let rand = Math.random() * total;

        for (const [rarity, { weight }] of Object.entries(rarityData)) {
            if (rand < weight) return rarity;
            rand -= weight;
        }
        return 'uncommon';
    }

    function getGuaranteedRarityAndAbove(minRarity) {
  
        const minIndex = rarities.indexOf(minRarity);
        if (minIndex === -1) {
            throw new Error(`Invalid minRarity: ${minRarity}`);
            //return minRarityAndAbove[0];
        }
        const minRarityAndAbove = rarities.slice(minIndex);
    
        const total = minRarityAndAbove.reduce((sum, rarity) => sum + rarityData[rarity].weight, 0);
        if (total === 0) {
            throw new Error("No valid rarities with weight > 0");
            //return minRarityAndAbove[0];
        }
    
        const normalizedWeights = minRarityAndAbove.map(rarity => ({
            rarity,
            weight: rarityData[rarity].weight / total
        }));


        let rand = Math.random();
        for (const { rarity, weight } of normalizedWeights) {
            if (rand < weight) return rarity;
            rand -= weight;
        }
    
        return minRarityAndAbove[0]; //fallback
    }

    

    function starAnimation(container, count, color) {
        return new Promise((resolve) => {
            const completions = [];
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const starDiv = document.createElement('div');
                    starDiv.className = 'star-img-container star-hidden';
    
                    const starImg = document.createElement('img');
                    starImg.src = `assets/star-${color}.png`;
                    starImg.alt = '';
                    starDiv.appendChild(starImg);
                    container.appendChild(starDiv);
    
                    starDiv.classList.remove('star-hidden');
                    starDiv.classList.add('star-reveal');
    
                    const handleAnimationEnd = () => {
                        starDiv.removeEventListener('animationend', handleAnimationEnd);
                        completions.push(true);
                        if (completions.length === count) {
                            resolve();
                        }
                    };
                    
                    starDiv.addEventListener('animationend', handleAnimationEnd);
                }, i * 120);
            }
        });
    }


    function manualAddStars(starContainer, starCount, color){
        for (let i = 0; i < starCount; i++) {
            const starDiv = document.createElement('div');
            starDiv.className = 'star-img-container';
            const starImg = document.createElement('img');
            starImg.src = `assets/star-${color}.png`;
            starImg.alt = '';
            starDiv.appendChild(starImg);
            starContainer.appendChild(starDiv);
        }
    }

    function appendCardAnimation(card, rarity, delay) {
        const starContainer = card.querySelector('.star-container');
        const [_weight, starCount, starColor] = getRarityData(rarity);

        return new Promise((resolve) => {
            setTimeout(() => {
                card.classList.remove('hidden');
                card.classList.add('revealed'); 
    
                card.addEventListener('animationend', (event) => {
                    if (isCardLegendaryOrMore(rarity)) {
                        starAnimation(starContainer, starCount, starColor).then(resolve);
                    }
                    else{
                        resolve();
                    }
                }, { once: true });
    
            }, delay);
        });
    }
    
    

    function createCard(rarity, cardContent = "Stuff") {
        const [_weight, starCount, starColor] = getRarityData(rarity);
        const card = document.createElement('div');
        card.className = `card ${rarity} hidden`;
    
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    
        const middle = document.createElement('div');
        middle.className = 'card-middle';
        middle.textContent = cardContent;
    
        const starContainer = document.createElement('div');
        starContainer.className = 'star-container';
        starContainer.dataset.rarity = rarity;
        starContainer.dataset.stars = starCount;
    
        card.appendChild(title);
        card.appendChild(middle);
        card.appendChild(starContainer);

        if (!isCardLegendaryOrMore(rarity)){
            manualAddStars(starContainer, starCount, starColor)
        }

        return card;
    }
    
    function onAllAnimationsComplete(){
        console.log("All animations completed");
        const cardsInContainer = cardContainer.getElementsByClassName("card");
        for (const card of cardsInContainer) {
            card.classList.remove('revealed');
        }
    }

    async function pullCards(numberOfCards = 10){
        const cardPromises = [];
        const unguaranteedCards = numberOfCards >= 10 ? numberOfCards - 1 : numberOfCards;
        for (let i = 0; i < unguaranteedCards; i++){
            const rarity = getRandomRarity();
            const card = createCard(rarity); // 150ms stagger
            cardPromises.push(appendCardAnimation(card, rarity, i * 150));
            cardContainer.appendChild(card);
        }

        const pullGuaranteed = unguaranteedCards !== numberOfCards
        if (pullGuaranteed){
            const guaranteedRarity = getGuaranteedRarityAndAbove("mythic");
            const card = createCard(guaranteedRarity);
            cardPromises.push(appendCardAnimation(card, guaranteedRarity, (numberOfCards - 1) * 150));
            cardContainer.appendChild(card);
        } 

        await Promise.all(cardPromises).then(onAllAnimationsComplete);
    }   

    async function pullFixedSequence(raritySequence = [], cardContentSequence = []){
        if (raritySequence.length === 0) return;

        const cardPromises = [];
        for (let i = 0; i < raritySequence.length; i++){
            let rarity = raritySequence[i];
            if (rarities.indexOf(rarity) === -1) rarity = 'uncommon';
            const card = createCard(rarity, cardContentSequence[i] ?? undefined);
            cardPromises.push(appendCardAnimation(card, rarity, i * 150));
            cardContainer.appendChild(card);
        }

        await Promise.all(cardPromises).then(onAllAnimationsComplete);
    }
  

    pullButton.addEventListener('click', async () => {
        cardContainer.innerHTML = '';
        const raritySequence = ["common", "common", "common", "common", "common", "mythic"];
        //await pullFixedSequence(raritySequence);
        await pullCards(5);

    });
});