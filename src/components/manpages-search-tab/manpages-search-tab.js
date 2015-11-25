import ko from 'knockout';
import templateMarkup from 'text!./manpages-search-tab.html';
import 'typeahead-jquery';
import 'bloodhound';

class ManpagesSearchTab {
    constructor(params) {
        this.addEditorPaneTab = params.addEditorPaneTab;
        this.initBloodhound();
        this.initTypeahead();
    }

    initBloodhound() {
        this.manPages = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name', 'summary'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            limit: 10,
            prefetch: {
                url: 'https://cs-education.github.io/sysassets/man_pages/sys_man_page_index.min.json'
            }
        });

        this.manPages.initialize();
    }

    initTypeahead() {
        var lastSelectedManPage = null;
        $('#man-pages-search-typeahead').children('.typeahead').typeahead({
            highlight: true
        }, {
            displayKey: 'name',
            source: this.manPages.ttAdapter(),
            templates: {
                empty: [
                    '<div class="empty-message">',
                    'unable to find any man pages that match the current query',
                    '</div>'
                ].join('\n'),
                // Typeahead Docs (https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#datasets):
                // "Note a precompiled template is a function that takes a JavaScript object as its first argument and returns a HTML string."
                // So instead of using some templating library, using a simple function to act as a compiled template
                suggestion: function (context) {
                    return [
                        '<div>',
                        '<p><strong>' + context.name + '</strong><span class="pull-right"> Section ' + context.section + '</span>' + '</p>',
                        '<p>' + context.summary + '</p>',
                        '</div>'
                    ].join('\n');
                }
            }
        }).on('typeahead:selected typeahead:autocompleted', function (e, suggestion) {
            lastSelectedManPage = suggestion;
        }).keypress(function (e) {
            if (e.which === 13) {
                // Enter key pressed
                openManPage(lastSelectedManPage);
            } else {
                // User typed in something
                // Discard the last selected man page because it should be saved only when
                // the user autocompleted the typeahead hint or used a suggestion
                lastSelectedManPage = null;
            }
        }).keydown(function (e) {
            if (e.which === 8) {
                // Backspace pressed
                // keypress does not fire for Backspace in Chrome
                // (https://stackoverflow.com/questions/4690330/jquery-keypress-backspace-wont-fire)
                lastSelectedManPage = null;
            }
        });

        $('#man-page-open-btn').click(() => {
            this.openManPage(lastSelectedManPage);
        });
    }

    openManPage(selectedManPage) {
        if (!selectedManPage)
            return;

        var name = selectedManPage.name,
            section = selectedManPage.section;

        this.addEditorPaneTab({
            title: `${name} (${section})`,
            component: {
                name: 'manpage-tab',
                params: {
                    manPageName: name,
                    manPageSection: section
                }
            }
        });
    }

    dispose() {
        // This runs when the component is torn down. Put here any logic necessary to clean up,
        // for example cancelling setTimeouts or disposing Knockout subscriptions/computeds.
    }
}

export default { viewModel: ManpagesSearchTab, template: templateMarkup };
