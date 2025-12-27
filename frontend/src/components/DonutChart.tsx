import { Text, Loader, Center, Button, Group } from '@mantine/core';
import { DonutChart as MantineDonutChart } from '@mantine/charts';
import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { actualExpenseEntriesApi } from '../services/actualExpenseEntriesApi';
import type { ActualExpenseEntry } from '../models/ActualExpenseEntry';
import { formatCurrency } from '../utils/currency';
import { monthToYYYYMM } from '../utils/months';
import { CurrencyTooltip } from './shared/CurrencyTooltip';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const categoryColors: Record<string, string> = {
  'comfort': '#51CF66',
  'entertainment and leisure': '#9775FA',
  'essential': '#FF6B35',
  'extras': '#339AF0',
  'unforeseen': '#FF6B6B',
};

const categoryLabels: Record<string, string> = {
  'comfort': 'Comfort',
  'entertainment and leisure': 'Entertainment and Leisure',
  'essential': 'Essential',
  'extras': 'Extras',
  'unforeseen': 'Unforeseen',
};

// Generate colors for items dynamically
const generateItemColors = (count: number, baseColor: string): string[] => {
  const colors: string[] = [];
  const base = baseColor.replace('#', '');
  const r = parseInt(base.substring(0, 2), 16);
  const g = parseInt(base.substring(2, 4), 16);
  const b = parseInt(base.substring(4, 6), 16);
  
  for (let i = 0; i < count; i++) {
    const factor = 0.7 + (i * 0.3 / Math.max(count - 1, 1));
    const newR = Math.min(255, Math.floor(r * factor));
    const newG = Math.min(255, Math.floor(g * factor));
    const newB = Math.min(255, Math.floor(b * factor));
    colors.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`);
  }
  return colors;
};

const DonutChart = () => {
  const { selectedMonth, selectedYear, dataChangeCounter } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [itemData, setItemData] = useState<CategoryData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<ActualExpenseEntry[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAndGroupExpenses = async () => {
      if (!selectedMonth || !selectedYear) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const month = monthToYYYYMM(selectedMonth, selectedYear);
        const entries: ActualExpenseEntry[] = await actualExpenseEntriesApi.getAll(month);
        setAllEntries(entries);

        // Group by category and sum amounts
        const categoryMap = new Map<string, number>();
        let total = 0;

        entries.forEach((entry) => {
          const current = categoryMap.get(entry.category) || 0;
          categoryMap.set(entry.category, current + entry.amount);
          total += entry.amount;
        });

        // Convert to array format for the chart
        const data: CategoryData[] = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          name: categoryLabels[category] || category,
          value: amount,
          color: categoryColors[category] || '#868E96',
        }));

        // Sort by value descending
        data.sort((a, b) => b.value - a.value);

        setCategoryData(data);
        setTotalAmount(total);
        
        // Reset selected category when month/year changes
        setSelectedCategory(null);
      } catch (error) {
        console.error('Failed to fetch expense data:', error);
        setCategoryData([]);
        setTotalAmount(0);
        setAllEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupExpenses();
  }, [selectedMonth, selectedYear, dataChangeCounter]);

  // Update item data when category is selected
  useEffect(() => {
    if (!selectedCategory || allEntries.length === 0) {
      setItemData([]);
      return;
    }

    // Find the category key from the label
    const categoryKey = Object.keys(categoryLabels).find(
      key => categoryLabels[key] === selectedCategory
    );

    if (!categoryKey) {
      setItemData([]);
      return;
    }

    // Filter entries by category and group by item
    const filteredEntries = allEntries.filter(entry => entry.category === categoryKey);
    const itemMap = new Map<string, number>();
    let categoryTotal = 0;

    filteredEntries.forEach((entry) => {
      const current = itemMap.get(entry.item) || 0;
      itemMap.set(entry.item, current + entry.amount);
      categoryTotal += entry.amount;
    });

    // Get base color for the category
    const baseColor = categoryColors[categoryKey] || '#868E96';
    const itemColors = generateItemColors(itemMap.size, baseColor);

    // Convert to array format for the chart
    const data: CategoryData[] = Array.from(itemMap.entries())
      .map(([item, amount], index) => ({
        name: item,
        value: amount,
        color: itemColors[index] || baseColor,
      }))
      .sort((a, b) => b.value - a.value);

    setItemData(data);
    setTotalAmount(categoryTotal);
  }, [selectedCategory, allEntries]);

  // Attach click listeners to chart segments and set cursor style
  useEffect(() => {
    const isItemView = selectedCategory !== null;
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const handleClick = (event: MouseEvent) => {
      if (isItemView) return;
      
      const target = event.target as HTMLElement;
      const path = target.closest('path');
      
      if (!path) return;
      
      // Try to get the data from various possible attributes
      const pathData = path.getAttribute('data-name') || 
                      path.getAttribute('name') ||
                      path.getAttribute('data-key');
      
      if (pathData) {
        const clickedCategory = categoryData.find(cat => cat.name === pathData);
        if (clickedCategory) {
          setSelectedCategory(clickedCategory.name);
          return;
        }
      }
      
      // Fallback: match by fill color
      const fillColor = path.getAttribute('fill');
      if (fillColor) {
        const clickedCategory = categoryData.find(cat => cat.color === fillColor);
        if (clickedCategory) {
          setSelectedCategory(clickedCategory.name);
        }
      }
    };

    // Set cursor style on SVG paths
    const setCursorStyle = () => {
      const svg = container.querySelector('svg');
      if (svg) {
        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
          path.style.cursor = isItemView ? 'default' : 'pointer';
        });
      }
    };

    // Use a small delay to ensure the chart is rendered
    let observer: MutationObserver | null = null;
    const timeoutId = setTimeout(() => {
      if (!isItemView) {
        container.addEventListener('click', handleClick);
      }
      setCursorStyle();
      
      // Also set cursor when paths are added (in case of re-render)
      observer = new MutationObserver(() => {
        setCursorStyle();
      });
      observer.observe(container, { childList: true, subtree: true });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (!isItemView) {
        container.removeEventListener('click', handleClick);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, [categoryData, selectedCategory]);

  const handleBackClick = () => {
    setSelectedCategory(null);
    // Recalculate total for categories
    const categoryMap = new Map<string, number>();
    let total = 0;
    allEntries.forEach((entry) => {
      const current = categoryMap.get(entry.category) || 0;
      categoryMap.set(entry.category, current + entry.amount);
      total += entry.amount;
    });
    setTotalAmount(total);
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  const currentData = selectedCategory ? itemData : categoryData;
  const isItemView = selectedCategory !== null;

  if (currentData.length === 0) {
    return (
      <Center h={400}>
        <Text c="dimmed">
          {isItemView 
            ? `No items found in ${selectedCategory} category for the selected period`
            : 'No expense data available for the selected period'}
        </Text>
      </Center>
    );
  }

  const CustomTooltip = (props: any) => (
    <CurrencyTooltip
      {...props}
      showLabel={false}
      showPercentage={true}
      totalAmount={totalAmount}
      percentageLabel={isItemView ? 'category total' : 'total'}
    />
  );

  return (
    <>
      {isItemView && (
        <Group mb="md" justify="center">
          <Button variant="subtle" onClick={handleBackClick}>
            ← Back to Categories
          </Button>
        </Group>
      )}
      <div 
        ref={chartContainerRef}
        style={{ cursor: isItemView ? 'default' : 'pointer', display: 'inline-block', width: '100%' }}
      >
        <MantineDonutChart
          data={currentData}
          tooltipDataSource="segment"
          tooltipProps={{
            content: CustomTooltip,
          }}
          size={300}
          thickness={40}
          mx="auto"
          mb="md"
        />
      </div>
      <Text size="lg" fw={500} ta="center" mb="xs">
        {isItemView ? `${selectedCategory} Total` : 'Total'}: {formatCurrency(totalAmount, 'EUR')}
      </Text>
      <Text size="sm" c="dimmed" ta="center">
        {isItemView 
          ? `Items in ${selectedCategory} category for ${selectedMonth && selectedYear 
            ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
            : 'selected period'}`
          : `Actual expenses grouped by category for ${selectedMonth && selectedYear 
            ? `${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
            : 'selected period'}. Click on a category to see item breakdown.`}
      </Text>
    </>
  );
};

export default DonutChart;

