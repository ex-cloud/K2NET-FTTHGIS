package parser

import (
	"bufio"
	"regexp"
	"strings"
	"gopkg.in/yaml.v3"
)

// Frontmatter represents the YAML metadata header in an Obsidian Task / Project note.
type Frontmatter struct {
	TaskID     string   `yaml:"task_id"`
	Type       string   `yaml:"type"`
	Scope      string   `yaml:"scope"`
	Status     string   `yaml:"status"`
	Priority   string   `yaml:"priority"`
	Lead       string   `yaml:"lead"`
	Assignee   string   `yaml:"assignee"`
	TargetDate string   `yaml:"target_date"`
	DueDate    string   `yaml:"due_date"`
	GeomRef    string   `yaml:"geom_ref"`
	Tags       []string `yaml:"tags"`
}

// ChecklistItem represents a Markdown checklist item with completion status.
type ChecklistItem struct {
	Text      string
	Completed bool
}

// ParsedNote contains the parsed frontmatter and checklist items from an Obsidian markdown file.
type ParsedNote struct {
	Frontmatter Frontmatter
	Title       string
	Checklist   []ChecklistItem
	TotalChecks int
	DoneChecks  int
	Percentage  int
}

var (
	frontmatterRegex = regexp.MustCompile(`(?s)^---\r?\n(.*?)\r?\n---`)
	checklistRegex   = regexp.MustCompile(`^\s*-\s*\[([ xX])\]\s*(.*)$`)
	titleRegex       = regexp.MustCompile(`^#\s+(?:🚀|🎫|📋)?\s*(.+)$`)
)

// ParseMarkdownNote extracts YAML frontmatter and checklist status from an Obsidian note.
func ParseMarkdownNote(content string) (*ParsedNote, error) {
	result := &ParsedNote{}

	// 1. Extract and unmarshal YAML Frontmatter
	if fmMatch := frontmatterRegex.FindStringSubmatch(content); len(fmMatch) > 1 {
		yamlContent := fmMatch[1]
		var fm Frontmatter
		if err := yaml.Unmarshal([]byte(yamlContent), &fm); err == nil {
			result.Frontmatter = fm
		}
	}

	// 2. Parse line by line for title and checklist items
	scanner := bufio.NewScanner(strings.NewReader(content))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Title
		if result.Title == "" {
			if tMatch := titleRegex.FindStringSubmatch(line); len(tMatch) > 1 {
				result.Title = strings.TrimSpace(tMatch[1])
			}
		}

		// Checklist items: - [ ] or - [x]
		if cMatch := checklistRegex.FindStringSubmatch(line); len(cMatch) > 2 {
			isDone := strings.ToLower(cMatch[1]) == "x"
			text := strings.TrimSpace(cMatch[2])

			result.Checklist = append(result.Checklist, ChecklistItem{
				Text:      text,
				Completed: isDone,
			})
			result.TotalChecks++
			if isDone {
				result.DoneChecks++
			}
		}
	}

	// 3. Compute completion percentage
	if result.TotalChecks > 0 {
		result.Percentage = int((float64(result.DoneChecks) / float64(result.TotalChecks)) * 100)
	}

	return result, nil
}
