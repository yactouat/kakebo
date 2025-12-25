import { Tabs } from '@mantine/core';
import IncomeTable from '../IncomeTable';
import FixedExpenseTable from '../FixedExpenseTable';
import { useAppStore } from '../../stores/useAppStore';
import './PecuniaryDataPanels.css';

const PecuniaryDataPanels = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <Tabs 
      value={activeTab}
      onChange={(value) => value && setActiveTab(value)}
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
        <IncomeTable />
      </Tabs.Panel>

      <Tabs.Panel pt="md" value="fixed-expenses">
        <FixedExpenseTable />
      </Tabs.Panel>

      <Tabs.Panel pt="md" value="actual-expenses">
        <p>Actual expenses content will go here</p>
      </Tabs.Panel>
    </Tabs>
  );
};

export default PecuniaryDataPanels;

