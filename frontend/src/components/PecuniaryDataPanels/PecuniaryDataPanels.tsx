import { Tabs } from '@mantine/core';
import { useMemo } from 'react';
import IncomeTable from '../IncomeTable';
import './PecuniaryDataPanels.css';

interface IncomeEntry {
  amount: number;
  date: string;
  item: string;
  totalShown: number;
}

const PecuniaryDataPanels = () => {
  // TODO sample data - replace with actual data from store/API later
  const incomeData: IncomeEntry[] = [
    // TODO: add your income entries here
  ];

  // calculate total shown - use the last entry's `totalShown` if available, or sum of amounts
  const totalShown = useMemo(() => {
    if (incomeData.length === 0) return 0;
    // if `totalShown` represents a running total, use the last one
    // otherwise, sum all amounts
    return incomeData[incomeData.length - 1]?.totalShown ?? 
           incomeData.reduce((sum, entry) => sum + entry.amount, 0);
  }, [incomeData]);

  return (
    <Tabs 
      defaultValue="income" 
      mt="xl"
      className="pecuniary-tabs"
    >
      <Tabs.List>
        <Tabs.Tab 
          style={{ color: 'green' }} 
          value="income"
          data-tab-color="green"
        >
          Income
        </Tabs.Tab>
        <Tabs.Tab 
          style={{ color: 'red' }} 
          value="fixed-expenses"
          data-tab-color="red"
        >
          Fixed expenses
        </Tabs.Tab>
        <Tabs.Tab 
          style={{ color: 'orange' }} 
          value="actual-expenses"
          data-tab-color="orange"
        >
          Actual expenses
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel pt="md" value="income">
        <IncomeTable incomeData={incomeData} totalShown={totalShown} />
      </Tabs.Panel>

      <Tabs.Panel pt="md" value="fixed-expenses">
        <p>Fixed expenses content will go here</p>
      </Tabs.Panel>

      <Tabs.Panel pt="md" value="actual-expenses">
        <p>Actual expenses content will go here</p>
      </Tabs.Panel>
    </Tabs>
  );
};

export default PecuniaryDataPanels;

