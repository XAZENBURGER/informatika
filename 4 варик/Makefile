# Сборка всех программ лабораторной работы (в Linux имена без .exe —
# на Windows используйте -o lab.exe и т.д., см. комментарии в src/*.cpp)
CXX      = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
BUILD    = build

TARGETS = $(BUILD)/lab $(BUILD)/unique $(BUILD)/dedup_chars $(BUILD)/str_compare $(BUILD)/dupcheck $(BUILD)/mymore

all: $(TARGETS)

$(BUILD)/%: src/%.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $<

$(BUILD):
	mkdir -p $(BUILD)

test: all
	bash run_tests.sh

clean:
	rm -f $(TARGETS) $(BUILD)/*.txt

.PHONY: all test clean
