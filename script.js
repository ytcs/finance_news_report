document.addEventListener('DOMContentLoaded', () => {
    fetch('news_report.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tabButtonsContainer = document.getElementById('tab-buttons');
            const tabContentContainer = document.getElementById('tab-content');

            // Sort news items by eventTimestamp in descending order (most recent first)
            data.sort((a, b) => new Date(b.eventTimestamp) - new Date(a.eventTimestamp));

            // Set the report title with the processed timestamp
            if (data.length > 0) {
                const processedTimestamp = new Date(data[0].processedTimestamp);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                document.getElementById('report-title').textContent = `${processedTimestamp.toLocaleDateString('en-US', options)} News Summary`;
            }

            const groupedNews = data.reduce((acc, newsItem) => {
                (acc[newsItem.ticker] = acc[newsItem.ticker] || []).push(newsItem);
                return acc;
            }, {});

            // Map preliminaryImpact to a numerical sentiment score
            const sentimentScores = {
                'HIGHLY_POSITIVE': 2,
                'MODERATELY_POSITIVE': 1,
                'NEUTRAL': 0,
                'MODERATELY_NEGATIVE': -1,
                'HIGHLY_NEGATIVE': -2
            };

            // Calculate overall sentiment for each ticker and store it
            for (const ticker in groupedNews) {
                const totalSentiment = groupedNews[ticker].reduce((sum, newsItem) => {
                    return sum + (sentimentScores[newsItem.preliminaryImpact] || 0);
                }, 0);
                groupedNews[ticker].overallSentiment = totalSentiment / groupedNews[ticker].length;
            }

            // Sort tickers by overall sentiment in descending order
            const sortedTickers = Object.keys(groupedNews).sort((a, b) => {
                return groupedNews[b].overallSentiment - groupedNews[a].overallSentiment;
            });

            let firstTicker = null;

            for (const ticker of sortedTickers) {
                if (!firstTicker) {
                    firstTicker = ticker;
                }

                // Determine sentiment class for tab button
                let sentimentClass = '';
                const overallSentiment = groupedNews[ticker].overallSentiment;
                if (overallSentiment >= 1.5) {
                    sentimentClass = 'sentiment-positive';
                } else if (overallSentiment >= 0.5) {
                    sentimentClass = 'sentiment-moderately-positive';
                } else if (overallSentiment >= -0.5) {
                    sentimentClass = 'sentiment-neutral';
                } else if (overallSentiment >= -1.5) {
                    sentimentClass = 'sentiment-moderately-negative';
                } else {
                    sentimentClass = 'sentiment-negative';
                }

                // Create tab button
                const button = document.createElement('button');
                button.classList.add('tab-button', sentimentClass);
                button.textContent = ticker;
                button.dataset.ticker = ticker;
                tabButtonsContainer.appendChild(button);

                // Create tab pane
                const tabPane = document.createElement('div');
                tabPane.classList.add('tab-pane');
                tabPane.id = `tab-${ticker}`;
                tabContentContainer.appendChild(tabPane);

                // Create filter containers
                const filtersContainer = document.createElement('div');
                filtersContainer.classList.add('filters-container');
                tabPane.appendChild(filtersContainer);

                const impactFilterContainer = document.createElement('div');
                impactFilterContainer.classList.add('filter-group');
                // impactFilterContainer.innerHTML = '<h3>Impact:</h3>';
                filtersContainer.appendChild(impactFilterContainer);

                const eventTypeFilterContainer = document.createElement('div');
                eventTypeFilterContainer.classList.add('filter-group');
                // eventTypeFilterContainer.innerHTML = '<h3>Event Type:</h3>';
                filtersContainer.appendChild(eventTypeFilterContainer);

                // Get unique preliminaryImpact and eventType values for the current ticker
                const uniqueImpacts = [...new Set(groupedNews[ticker].map(item => item.preliminaryImpact))];
                const uniqueEventTypes = [...new Set(groupedNews[ticker].map(item => item.eventType))];

                let activeFilters = { preliminaryImpact: [], eventType: [] };

                // Function to filter news cards
                const filterNewsCards = () => {
                    const newsCards = tabPane.querySelectorAll('.news-card');
                    newsCards.forEach(card => {
                        const impact = card.querySelector('.impact').textContent.trim().replace(/ /g, '_');
                        const eventType = card.querySelector('.event-type').textContent.trim().replace(/ /g, '_');

                        const impactMatch = activeFilters.preliminaryImpact.length === 0 || activeFilters.preliminaryImpact.includes(impact);
                        const eventTypeMatch = activeFilters.eventType.length === 0 || activeFilters.eventType.includes(eventType);

                        if (impactMatch && eventTypeMatch) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                };

                // Create filter bubbles for preliminaryImpact
                uniqueImpacts.forEach(impact => {
                    const bubble = document.createElement('span');
                    bubble.classList.add('filter-bubble');
                    bubble.textContent = impact.replace(/_/g, ' ');
                    bubble.dataset.filterType = 'preliminaryImpact';
                    bubble.dataset.filterValue = impact;
                    impactFilterContainer.appendChild(bubble);

                    bubble.addEventListener('click', () => {
                        bubble.classList.toggle('active');
                        const index = activeFilters.preliminaryImpact.indexOf(impact);
                        if (index > -1) {
                            activeFilters.preliminaryImpact.splice(index, 1);
                        } else {
                            activeFilters.preliminaryImpact.push(impact);
                        }
                        filterNewsCards();
                    });
                });

                // Create filter bubbles for eventType
                uniqueEventTypes.forEach(eventType => {
                    const bubble = document.createElement('span');
                    bubble.classList.add('filter-bubble');
                    bubble.textContent = eventType.replace(/_/g, ' ');
                    bubble.dataset.filterType = 'eventType';
                    bubble.dataset.filterValue = eventType;
                    eventTypeFilterContainer.appendChild(bubble);

                    bubble.addEventListener('click', () => {
                        bubble.classList.toggle('active');
                        const index = activeFilters.eventType.indexOf(eventType);
                        if (index > -1) {
                            activeFilters.eventType.splice(index, 1);
                        } else {
                            activeFilters.eventType.push(eventType);
                        }
                        filterNewsCards();
                    });
                });

                // Populate tab pane with news cards
                groupedNews[ticker].forEach(newsItem => {
                    const newsCard = document.createElement('div');
                    newsCard.classList.add('news-card');

                    const headline = document.createElement('h2');
                    headline.textContent = newsItem.headline;

                    const impact = document.createElement('span');
                    impact.classList.add('impact');
                    impact.classList.add(newsItem.preliminaryImpact.toLowerCase().replace(/_/g, '-'));
                    impact.textContent = newsItem.preliminaryImpact.replace(/_/g, ' ');

                    const eventType = document.createElement('span');
                    eventType.classList.add('event-type');
                    // Add class based on event type sentiment
                    if (['EARNINGS_BEAT_WEAK_GUIDANCE', 'DIVIDEND_CUT_OR_SUSPENSION', 'MNA_ACQUIRER_STOCK_DROP', 'MNA_DEAL_BREAK', 'FDA_DRUG_REJECTION', 'CREDIT_RATING_DOWNGRADE', 'PATENT_LITIGATION_DEFENDANT', 'REGULATORY_INVESTIGATION', 'UNSCHEDULED_NEGATIVE_EVENT'].includes(newsItem.eventType)) {
                        eventType.classList.add('negative-event');
                    } else if (['EARNINGS_MISS_STRONG_GUIDANCE', 'UNSCHEDULED_POSITIVE_EVENT'].includes(newsItem.eventType)) {
                        eventType.classList.add('positive-event');
                    }
                    eventType.textContent = newsItem.eventType.replace(/_/g, ' ');

                    const eventDate = document.createElement('p');
                    eventDate.classList.add('event-date');
                    // Format the date for display
                    const date = new Date(newsItem.eventTimestamp);
                    eventDate.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    const tickerInfo = document.createElement('p');
                    tickerInfo.classList.add('ticker-info');
                    tickerInfo.textContent = `${newsItem.companyName}`;

                    const summary = document.createElement('p');
                    summary.textContent = newsItem.summary;

                    const reasoning = document.createElement('p');
                    reasoning.textContent = `Reasoning: ${newsItem.reasoning}`;

                    const sourceLink = document.createElement('a');
                    sourceLink.href = newsItem.sourceUrl;
                    sourceLink.textContent = `Source: ${newsItem.source}`;
                    sourceLink.target = '_blank';

                    newsCard.appendChild(headline);
                    newsCard.appendChild(impact);
                    newsCard.appendChild(eventType);
                    newsCard.appendChild(eventDate);
                    newsCard.appendChild(tickerInfo);
                    newsCard.appendChild(summary);
                    newsCard.appendChild(reasoning);
                    newsCard.appendChild(sourceLink);

                    tabPane.appendChild(newsCard);
                });

                // Add event listener to tab button
                button.addEventListener('click', () => {
                    // Remove active class from all buttons and panes
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

                    // Add active class to clicked button and corresponding pane
                    button.classList.add('active');
                    tabPane.classList.add('active');
                    // Apply filters when tab is activated
                    filterNewsCards();
                });
            }

            // Activate the first tab by default
            if (firstTicker) {
                document.querySelector(`.tab-button[data-ticker='${firstTicker}']`).click();
            }
        })
        .catch(error => {
            console.error('Error fetching or parsing news data:', error);
            document.getElementById('tab-content').innerHTML = '<p>Failed to load news. Please try again later.</p>';
        });
}); 