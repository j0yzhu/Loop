import {Input} from "~/components/ui/input";
import {View, Text, ScrollView, TouchableOpacity, Pressable} from 'react-native';
import {FilterIcon, SearchIcon} from "lucide-react-native";
import {Button} from "~/components/ui/button";
import {Category} from "~/services/CommunityService";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/components/ui/dialog';
import {Checkbox} from "~/components/ui/checkbox";
import {Badge} from "~/components/ui/badge";
import {Separator} from "~/components/ui/separator";
import {H4, Muted, Small} from "~/components/ui/typography";
import {useColorScheme} from "~/lib/useColorScheme";


interface SearchBarProps {
    search: string;
    onSearchChange: (val: string) => void;
    loading: boolean;
    onLoadingChange: (val: boolean) => void;
    categories: Category[];
    selectedCategories: Category[];
    onSelectedCategoriesChange: (selectedCategories: Category[]) => void;
    showFilter?: boolean; 
    placeholder?: string;
}


export const SearchBar: React.FC<SearchBarProps> = (props) => {
    return (
        <View className="flex flex-row gap-2 items-center">
            <Input
                value={props.search}
                onChangeText={props.onSearchChange}
                className="flex-1"
                placeholder={props.placeholder || "Search"}        
            />
            {props.showFilter !== false && (
                <CategoryFilterDialog
                    categories={props.categories}
                    selectedCategories={props.selectedCategories}
                    onSelectedCategoriesChange={props.onSelectedCategoriesChange}
                />
            )}
        </View>
    );

};

interface CategoryFilterDialogProps {
    categories: Category[]
    selectedCategories: Category[];
    onSelectedCategoriesChange: (selectedCategories: Category[]) => void;
}

const CategoryFilterDialog: React.FC<CategoryFilterDialogProps> = (props) => {
    const groupedCategories = props.categories.reduce<Record<string, Category[]>>((acc, category) => {
        const topic = category.topic || "Other";
        if (!acc[topic]) acc[topic] = [];
        acc[topic].push(category);
        return acc;
    }, {});

    const { isDarkColorScheme } = useColorScheme();

    const isSelected = (categoryId: number): boolean => {
        return props.selectedCategories.some((c) => c.id === categoryId);
    }

    const toggleSelectCategory = (category: Category) => {
        console.log("Pressed")
        const isAlreadySelected = props.selectedCategories.some((c) => c.id === category.id);
        let updatedSelected: Category[];

        if (isAlreadySelected) {
            // Deselect category
            console.log("Deselecting", category.subtopic)
            updatedSelected = props.selectedCategories.filter((c) => c.id !== category.id);
        } else {
            // Select category
            console.log("Selecting", category.subtopic)
            updatedSelected = [...props.selectedCategories, category];
        }

        props.onSelectedCategoriesChange(updatedSelected);
    };


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant={props.selectedCategories && props.selectedCategories.length > 0 ? "default" : "outline"}
                    size="icon"
                    className="h-11 w-11"
                >
                    <Text>
                        <FilterIcon color={isDarkColorScheme ? "white" : "black"} />
                    </Text>
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] m-2'>
                <DialogHeader>
                    <DialogTitle>
                        <Text>Category Filters</Text>
                    </DialogTitle>
                    <DialogDescription>
                        <Text>Select your categories</Text>
                    </DialogDescription>

                </DialogHeader>
                <ScrollView
                    className="max-h-[300px]"
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={true}
                    indicatorStyle="white"
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    {Object.entries(groupedCategories).map(([topic, group], index) => (
                        <View key={`outer-${index}`} className="w-full">
                            <H4 className="mb-1 text-lg">{topic}</H4>
                            <View key={`inner-${index}`} className="flex flex-row flex-wrap gap-2">
                                {group.map((category) => {
                                    return (
                                            <Button key={category.id} size="xs" onPress={() => toggleSelectCategory(category)} variant={isSelected(category.id) ? "default" : "outline"}>
                                                <Text className={isSelected(category.id) ? "text-background" : "text-foreground"}>{category.subtopic}</Text>
                                            </Button>
                                    );
                                })}
                            </View>
                            <Separator className="my-4"/>
                        </View>
                    ))}
                </ScrollView>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>
                            <Text>OK</Text>
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default SearchBar;