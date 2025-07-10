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

            // Collect all unique event types across all news items
            const allUniqueEventTypes = [...new Set(data.map(item => item.eventType))];
            allUniqueEventTypes.sort(); // Sort alphabetically

            // Define positive and negative event types based on existing classifications
            const negativeEventTypesList = ['EARNINGS_BEAT_WEAK_GUIDANCE', 'DIVIDEND_CUT_OR_SUSPENSION', 'MNA_ACQUIRER_STOCK_DROP', 'MNA_DEAL_BREAK', 'FDA_DRUG_REJECTION', 'CREDIT_RATING_DOWNGRADE', 'PATENT_LITIGATION_DEFENDANT', 'REGULATORY_INVESTIGATION', 'UNSCHEDULED_NEGATIVE_EVENT'];
            const positiveEventTypesList = ['EARNINGS_MISS_STRONG_GUIDANCE', 'UNSCHEDULED_POSITIVE_EVENT'];

            const positiveEventTypes = allUniqueEventTypes.filter(type => positiveEventTypesList.includes(type));
            const negativeEventTypes = allUniqueEventTypes.filter(type => negativeEventTypesList.includes(type));
            const neutralEventTypes = allUniqueEventTypes.filter(type => !positiveEventTypesList.includes(type) && !negativeEventTypesList.includes(type));

            let activeGlobalEventFilters = []; // New global filter state

            // Function to filter news cards globally and locally
            const filterNewsCards = () => {
                let activeTabEmpty = false;
                let firstNonEmptyTicker = null;

                document.querySelectorAll('.tab-pane').forEach(tabPane => {
                    const ticker = tabPane.id.replace('tab-', '');
                    const tabButton = document.querySelector(`.tab-button[data-ticker="${ticker}"]`);

                    let visibleNewsCount = 0;
                    const newsCards = tabPane.querySelectorAll('.news-card');
                    newsCards.forEach(card => {
                        const eventType = card.querySelector('.event-type').textContent.trim().replace(/ /g, '_');
                        const eventTypeMatch = activeGlobalEventFilters.length === 0 || activeGlobalEventFilters.includes(eventType);

                        if (eventTypeMatch) {
                            card.style.display = '';
                            visibleNewsCount++;
                        } else {
                            card.style.display = 'none';
                        }
                    });

                    // Hide/show ticker tab based on visible news count
                    if (tabButton) {
                        if (visibleNewsCount === 0) {
                            tabButton.style.display = 'none';
                            // If the current active tab becomes empty, mark it
                            if (tabPane.classList.contains('active')) {
                                activeTabEmpty = true;
                            }
                        } else {
                            tabButton.style.display = '';
                            // Keep track of the first non-empty ticker
                            if (!firstNonEmptyTicker) {
                                firstNonEmptyTicker = ticker;
                            }
                        }
                    }
                });

                // If the active tab became empty, switch to the first non-empty one
                if (activeTabEmpty && firstNonEmptyTicker) {
                    const firstNonEmptyTabButton = document.querySelector(`.tab-button[data-ticker="${firstNonEmptyTicker}"]`);
                    if (firstNonEmptyTabButton) {
                        firstNonEmptyTabButton.click();
                    }
                } else if (activeTabEmpty && !firstNonEmptyTicker) {
                    // If all tabs are empty, clear tab content and show a message
                    document.getElementById('tab-buttons').innerHTML = '';
                    document.getElementById('tab-content').innerHTML = '<p>No news available for the selected filters.</p>';
                }
            };

            // Create global filter bubbles for eventType
            const globalEventTypeFilterBubblesContainer = document.getElementById('global-event-type-filter-bubbles');
            globalEventTypeFilterBubblesContainer.innerHTML = ''; // Clear existing bubbles

            // Create Positive Event Types section
            const positiveSection = document.createElement('div');
            positiveSection.classList.add('filter-group-section', 'positive-events');
            const positiveHeader = document.createElement('h4');
            positiveHeader.textContent = ''; // Remove text content
            positiveSection.appendChild(positiveHeader);
            globalEventTypeFilterBubblesContainer.appendChild(positiveSection);

            positiveEventTypes.forEach(eventType => {
                const bubble = document.createElement('span');
                bubble.classList.add('filter-bubble', 'positive-event-bubble');
                bubble.textContent = eventType.replace(/_/g, ' ');
                bubble.dataset.filterType = 'eventType';
                bubble.dataset.filterValue = eventType;
                positiveSection.appendChild(bubble);

                bubble.addEventListener('click', () => {
                    bubble.classList.toggle('active');
                    const index = activeGlobalEventFilters.indexOf(eventType);
                    if (index > -1) {
                        activeGlobalEventFilters.splice(index, 1);
                    } else {
                        activeGlobalEventFilters.push(eventType);
                    }
                    filterNewsCards();
                });
            });

            // Create Negative Event Types section
            const negativeSection = document.createElement('div');
            negativeSection.classList.add('filter-group-section', 'negative-events');
            const negativeHeader = document.createElement('h4');
            negativeHeader.textContent = ''; // Remove text content
            negativeSection.appendChild(negativeHeader);
            globalEventTypeFilterBubblesContainer.appendChild(negativeSection);

            negativeEventTypes.forEach(eventType => {
                const bubble = document.createElement('span');
                bubble.classList.add('filter-bubble', 'negative-event-bubble');
                bubble.textContent = eventType.replace(/_/g, ' ');
                bubble.dataset.filterType = 'eventType';
                bubble.dataset.filterValue = eventType;
                negativeSection.appendChild(bubble);

                bubble.addEventListener('click', () => {
                    bubble.classList.toggle('active');
                    const index = activeGlobalEventFilters.indexOf(eventType);
                    if (index > -1) {
                        activeGlobalEventFilters.splice(index, 1);
                    } else {
                        activeGlobalEventFilters.push(eventType);
                    }
                    filterNewsCards();
                });
            });

            // Create Neutral/Other Event Types section (if any)
            if (neutralEventTypes.length > 0) {
                const neutralSection = document.createElement('div');
                neutralSection.classList.add('filter-group-section', 'neutral-events');
                const neutralHeader = document.createElement('h4');
                neutralHeader.textContent = ''; // Remove text content
                neutralSection.appendChild(neutralHeader);
                globalEventTypeFilterBubblesContainer.appendChild(neutralSection);

                neutralEventTypes.forEach(eventType => {
                    const bubble = document.createElement('span');
                    bubble.classList.add('filter-bubble', 'neutral-event-bubble');
                    bubble.textContent = eventType.replace(/_/g, ' ');
                    bubble.dataset.filterType = 'eventType';
                    bubble.dataset.filterValue = eventType;
                    neutralSection.appendChild(bubble);

                    bubble.addEventListener('click', () => {
                        bubble.classList.toggle('active');
                        const index = activeGlobalEventFilters.indexOf(eventType);
                        if (index > -1) {
                            activeGlobalEventFilters.splice(index, 1);
                        } else {
                            activeGlobalEventFilters.push(eventType);
                        }
                        filterNewsCards();
                    });
                });
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

            // Calculate and display overall market sentiment
            const calculateOverallSentiment = () => {
                const tickers = Object.keys(groupedNews);
                if (tickers.length === 0) return 0;

                const totalSentiment = tickers.reduce((sum, ticker) => {
                    return sum + groupedNews[ticker].overallSentiment;
                }, 0);

                return totalSentiment / tickers.length;
            };

            const updateThermometer = (sentimentScore) => {
                // Convert sentiment score from -2 to +2 range to 0-100% range
                const percentage = ((sentimentScore + 2) / 4) * 100;
                
                const thermometerFill = document.getElementById('thermometer-fill');
                
                if (thermometerFill) {
                    thermometerFill.style.width = `${percentage}%`;
                }
            };

            const overallSentiment = calculateOverallSentiment();
            updateThermometer(overallSentiment);

            // Sort tickers by overall sentiment in descending order
            const sortedTickers = Object.keys(groupedNews).sort((a, b) => {
                return groupedNews[a].overallSentiment - groupedNews[b].overallSentiment;
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

                // Get unique preliminaryImpact values for the current ticker
                const uniqueImpacts = [...new Set(groupedNews[ticker].map(item => item.preliminaryImpact))];

                let activeFilters = { preliminaryImpact: [] };

                // Function to filter news cards
                const filterNewsCardsTicker = () => {
                    const newsCards = tabPane.querySelectorAll('.news-card');
                    newsCards.forEach(card => {
                        const impact = card.querySelector('.impact').textContent.trim().replace(/ /g, '_');
                        const eventType = card.querySelector('.event-type').textContent.trim().replace(/ /g, '_');

                        const impactMatch = activeFilters.preliminaryImpact.length === 0 || activeFilters.preliminaryImpact.includes(impact);
                        const eventTypeMatch = activeGlobalEventFilters.length === 0 || activeGlobalEventFilters.includes(eventType);

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
                        filterNewsCardsTicker();
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

            // Activate the first ticker tab by default and apply filters
            if (firstTicker) {
                document.querySelector(`.tab-button[data-ticker="${firstTicker}"]`).classList.add('active');
                document.getElementById(`tab-${firstTicker}`).classList.add('active');
                filterNewsCards(); // Apply global filters when the first tab is activated
            }
        })
        .catch(error => console.error('Error fetching news data:', error));
}); 